require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRateLimit(url, params, fb_adAccountID) {
    const account_id = fb_adAccountID.split('_')[1];

    const response = await axios.get(url, { params });
    const adAccountUsage = response.headers['x-business-use-case-usage'];
    if (!adAccountUsage) {
      console.error('No business use case usage data found in the headers.');
      return null;
    }
    const usageData = JSON.parse(adAccountUsage);
    if (!usageData[account_id] || usageData[account_id].length === 0) {
        console.error('Usage data is missing or does not contain expected array elements.');
        return null;
    }

    const { call_count, total_cputime, total_time, estimated_time_to_regain_access } = usageData[account_id][0];

    // Dynamically adjust waiting based on usage
    const maxUsage = Math.max(call_count, total_cputime, total_time);
    if (maxUsage >= 90) {
        console.log('API usage nearing limit. Adjusting request rate.');
        await sleep((100 - maxUsage) * 1000); // Sleep time is dynamically calculated to prevent hitting the limit
    }

    if (estimated_time_to_regain_access > 0) {
        console.log(`Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes.`);
        await sleep(estimated_time_to_regain_access * 1000); // Wait for the block to lift
    }
    if (response.status == 400){
      console.log(`Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes.`);
      await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
      console.log(response.data);
      return fetchWithRateLimit(url, params, fb_adAccountID)
  }
    return response.data;
}


async function getCampaigns(fb_adAccountID, accessToken) {
  const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/campaigns`;
  const fields = 'name,adlabels,created_time,daily_budget,id,lifetime_budget,objective,promoted_object,spend_cap,start_time,status,stop_time,buying_type,budget_remaining,account_id,bid_strategy,primary_attribution,source_campaign,special_ad_categories,updated_time';
  
  let allCampaigns = [];
  let url = apiUrl;
  let params = {
    fields: fields,
    access_token: accessToken,
    limit: 50
};
  try {
      do {
          const response = await fetchWithRateLimit(url, params);
          //console.log('API Response:', response); // Log the full response
          if (response && response.data ) {
              allCampaigns.push(...response.data);
              url =  response.paging?.next;
          } else {
              //console.error('No campaigns data in response:', response); 
              // Ensure loop exits if no further data
          }
      } while (url);
  } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error; // Rethrow the error to be handled by the calling function
  }

  return allCampaigns;
}




  async function populateCampaigns(facebookCampaignData, postgres) {
    const query = `
      INSERT INTO fb_campaign (
        campaign_id, status, created_time, daily_budget, objective, start_time, stop_time, buying_type, budget_remaining, 
        bid_strategy, primary_attribution, source_campaign, special_ad_categories, updated_time, name, account_id, omni_business_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) ON CONFLICT (campaign_id) DO UPDATE SET 
        status = EXCLUDED.status,
        created_time = EXCLUDED.created_time,
        daily_budget = EXCLUDED.daily_budget,
        objective = EXCLUDED.objective,
        start_time = EXCLUDED.start_time,
        stop_time = EXCLUDED.stop_time,
        buying_type = EXCLUDED.buying_type,
        budget_remaining = EXCLUDED.budget_remaining,
        bid_strategy = EXCLUDED.bid_strategy,
        primary_attribution = EXCLUDED.primary_attribution,
        source_campaign = EXCLUDED.source_campaign,
        special_ad_categories = EXCLUDED.special_ad_categories,
        updated_time = EXCLUDED.updated_time,
        name = EXCLUDED.name,
        account_id = EXCLUDED.account_id,
        omni_business_id = EXCLUDED.omni_business_id;
    `; // Make sure to close the template literal properly
  
    const values = [
      facebookCampaignData.campaign_id, facebookCampaignData.status, facebookCampaignData.created_time, facebookCampaignData.daily_budget, 
      facebookCampaignData.objective, facebookCampaignData.start_time, facebookCampaignData.stop_time, facebookCampaignData.buying_type, 
      facebookCampaignData.budget_remaining, facebookCampaignData.bid_strategy, facebookCampaignData.primary_attribution, facebookCampaignData.source_campaign, 
      facebookCampaignData.special_ad_categories, facebookCampaignData.updated_time, facebookCampaignData.name, facebookCampaignData.ad_account_id, 
      facebookCampaignData.omni_business_id
    ];
  
    try {
      await postgres.query(query, values);
      console.log(`Inserted or updated campaign: ${facebookCampaignData.campaign_id} successfully`);
    } catch (err) {
      console.error('Insert or update error:', err.stack);
    }
  }
  




async function populateCampaignsMain (postgres, omniBusinessId, fb_adAccountID, accessToken) {
  
try{
  const facebookCampaignData = await getCampaigns(fb_adAccountID, accessToken);

  if (!facebookCampaignData || !facebookCampaignData.length===0) {
     throw new Error('Invalid ad account data fetched.');
  }

  for (const campaign of facebookCampaignData) {
    const campaignData = {
      campaign_id: campaign.id,
      status: campaign.status,
      created_time: campaign.created_time,
      daily_budget: campaign.daily_budget / 100 || '',
      objective: campaign.objective,
      start_time: campaign.start_time,
      stop_time: campaign.stop_time,
      buying_type: campaign.buying_type,
      budget_remaining: campaign.budget_remaining / 100 || '',
      bid_strategy: campaign.bid_strategy || '',
      primary_attribution: campaign.primary_attribution,
      source_campaign: campaign.source_campaign || '',
      special_ad_categories: campaign.special_ad_categories,
      updated_time: campaign.updated_time,
      name: campaign.name, 
      ad_account_id: fb_adAccountID, // Assuming this is the correct association
      omni_business_id: omniBusinessId,
    }

    // If order matters or you want to handle errors per campaign, await here
    await populateCampaigns(campaignData, postgres).catch((error) => {
      console.error(`Error populating campaign ${campaignData.campaign_id}: `, error);
    });
  }
} catch (error) {
  console.error('An error occurred in the main flow', error);
} finally {
   // Close the client connection at the end of all operations
}
  // Consider adding client.end() here to close the connection after all operations are done
}

module.exports= populateCampaignsMain;


