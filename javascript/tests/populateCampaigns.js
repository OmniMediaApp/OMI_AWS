require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRateLimit(url, params, fb_adAccountID, retryCount = 0, maxRetries = 3) {
    const account_id = fb_adAccountID.split('_')[1];

    try {
        const response = await axios.get(url, { params });

        const adAccountUsage = response.headers['x-business-use-case-usage'];
        
        const usageData = JSON?.parse(adAccountUsage);

        const { call_count, total_cputime, total_time, estimated_time_to_regain_access } = usageData[account_id][0];

        const maxUsage = Math.max(call_count, total_cputime, total_time);
        console.log(`PopulateCampaigns.js: API USAGE ${maxUsage}%`);

        return response.data;
    } catch (error) {

        console.log(error.response.status);
        if (error.response && (error.response.status === 400 || error.response.status === 500)) {
            if (retryCount < maxRetries) {
                const estimated_time_to_regain_access = JSON?.parse(error.response?.headers['x-business-use-case-usage'])?.[account_id]?.[0]?.estimated_time_to_regain_access || 1;
                const waitTime = (estimated_time_to_regain_access + 1) * 1000 * 60;
                console.log(`PopulateCampaigns.js: Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
                await sleep(waitTime);
                return fetchWithRateLimit(url, params, fb_adAccountID, retryCount + 1, maxRetries);
            } else {
                console.log(`PopulateCampaigns.js: Failed after ${maxRetries} retries.`);
                throw error;
            }
        } else {
            console.log(`PopulateCampaigns.js: Encountered unexpected error.`, error);
            throw error;
        }
    }
}

async function getCampaigns(fb_adAccountID, accessToken, activeOnly) {
    const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/campaigns?fields=name,adlabels,created_time,daily_budget,id,lifetime_budget,objective,promoted_object,spend_cap,start_time,status,stop_time,buying_type,budget_remaining,account_id,bid_strategy,primary_attribution,source_campaign,special_ad_categories,updated_time,smart_promotion_type`;
    
    let allCampaigns = [];
    let url = apiUrl;
    let params = {
        // fields: fields,
        access_token: accessToken,
        limit: 75
    };

    if (activeOnly) {
        params['filtering'] = '[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]';
    }

    let i = 0;
    try {
        do {
            i++;
            console.log('Fetching Campaigns ' + i + ' => Retreived Campaigns: ' + allCampaigns.length);
            const response = await fetchWithRateLimit(url, params, fb_adAccountID);
            if (response && response.data) {
                allCampaigns.push(...response.data);
                url = response.paging?.next;
            }
        } while (url);
    } catch (error) {
        console.error('PopulateCampaigns.js: Error fetching campaigns:', error);
        throw error;
    }

    return allCampaigns;
}

async function populateCampaigns(facebookCampaignDataBatch, postgres) {
    const query = `
        INSERT INTO fb_campaign (
            campaign_id, status, created_time, daily_budget, objective, start_time, stop_time, buying_type, budget_remaining, 
            bid_strategy, primary_attribution, source_campaign, special_ad_categories, updated_time, name, account_id, omni_business_id, smart_promotion_type
        ) VALUES 
        ${facebookCampaignDataBatch.map((_, i) => `(
            $${i * 18 + 1}, $${i * 18 + 2}, $${i * 18 + 3}, $${i * 18 + 4}, $${i * 18 + 5}, $${i * 18 + 6}, $${i * 18 + 7}, $${i * 18 + 8}, 
            $${i * 18 + 9}, $${i * 18 + 10}, $${i * 18 + 11}, $${i * 18 + 12}, $${i * 18 + 13}, $${i * 18 + 14}, $${i * 18 + 15}, $${i * 18 + 16}, 
            $${i * 18 + 17}, $${i * 18 + 18}
        )`).join(', ')}
        ON CONFLICT (campaign_id) DO UPDATE SET 
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
            omni_business_id = EXCLUDED.omni_business_id,
            smart_promotion_type = EXCLUDED.smart_promotion_type;
    `;

    const values = [];
    for (const campaign of facebookCampaignDataBatch) {
        values.push(
            campaign.campaign_id, campaign.status, campaign.created_time, campaign.daily_budget,
            campaign.objective, campaign.start_time, campaign.stop_time, campaign.buying_type,
            campaign.budget_remaining, campaign.bid_strategy, campaign.primary_attribution, campaign.source_campaign,
            campaign.special_ad_categories, campaign.updated_time, campaign.name, campaign.ad_account_id,
            campaign.omni_business_id, campaign.smart_promotion_type
        );
    }

    try {
        await postgres.query(query, values);
        console.log('campaign Batch inserted or updated successfully');
    } catch (err) {
        console.error('PopulateCampaigns.js: Insert or update error:', err.stack);
    }
}

async function populateCampaignsMain(postgres, omniBusinessId, fb_adAccountID, accessToken, activeOnly) {
    try {
        const facebookCampaignData = await getCampaigns(fb_adAccountID, accessToken, activeOnly);

        if (!facebookCampaignData || facebookCampaignData.length === 0) {
            return console.log('PopulateCampaigns.js: No campaigns found.');
        }

        const batchSize = 10;
        for (let i = 0; i < facebookCampaignData.length; i += batchSize) {
            const campaignBatch = facebookCampaignData.slice(i, i + batchSize).map(campaign => ({
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
                ad_account_id: fb_adAccountID,
                omni_business_id: omniBusinessId,
                smart_promotion_type: campaign.smart_promotion_type
            }));

            await populateCampaigns(campaignBatch, postgres);
        }
    } catch (error) {
        console.error('PopulateCampaigns.js: An error occurred in the main flow', error);
    }
}

module.exports = populateCampaignsMain;
