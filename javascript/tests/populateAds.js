require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');





const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRateLimit(url, params, fb_adAccountID) {
    const account_id = fb_adAccountID.split('_')[1];

    const response = await axios.get(url, { params });
    const adAccountUsage = response.headers['x-ad-account-usage'];
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
        console.log(`Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} seconds.`);
        await sleep(estimated_time_to_regain_access * 1000); // Wait for the block to lift
    }

    return response.data;
}

async function getAds(fb_adAccountID, accessToken, fb_adAccountID) {
    const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/ads`;
    const fields = 'account_id,ad_active_time,ad_review_feedback,ad_schedule_end_time,ad_schedule_start_time,adset_id,campaign_id,configured_status,conversion_domain,created_time,creative,id,effective_status,bid_amount,last_updated_by_app_id,name,preview_shareable_link,recommendations,source_ad,source_ad_id,status,tracking_specs,updated_time,adcreatives{id}';
    let allData = [];
    let nextPageUrl = apiUrl;
    let params = {
        fields: fields,
        access_token: accessToken
    };

    try {
        do {
            const response = await fetchWithRateLimit(nextPageUrl, params);
            //console.log('API Response:', response); // Log the full response
            if (response.data) {
                 allData.push(...response.data); // Collect all ad data across pages
                nextPageUrl = response.paging?.next; // Update the URL to the next page if available
                params = {}; // Clear parameters since the next URL will contain them if needed
            } else {
                console.error('No data field in response:', response);
                break; // Exit if no data is found
            }
        } while (nextPageUrl);
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }

    return allData;
}
async function populateAds(facebookAdData, postgres) {
    const query = `
        INSERT INTO fb_ad (
            ad_id, adset_id, campaign_id, account_id, name, configured_status, 
            created_time, creative, effective_status, last_updated_by_app_id,
            preview_shareable_link, source_ad, source_ad_id, status, 
            tracking_specs, ad_active_time, omni_business_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, 
            $7, $8, $9, $10, $11, 
            $12, $13, $14, $15, $16, $17
        )
        ON CONFLICT (ad_id) DO UPDATE SET
            adset_id = EXCLUDED.adset_id,
            campaign_id = EXCLUDED.campaign_id,
            account_id = EXCLUDED.account_id,
            name = EXCLUDED.name,
            configured_status = EXCLUDED.configured_status,
            created_time = EXCLUDED.created_time,
            creative = EXCLUDED.creative,
            effective_status = EXCLUDED.effective_status,
            last_updated_by_app_id = EXCLUDED.last_updated_by_app_id,
            preview_shareable_link = EXCLUDED.preview_shareable_link,
            source_ad = EXCLUDED.source_ad,
            source_ad_id = EXCLUDED.source_ad_id,
            status = EXCLUDED.status,
            tracking_specs = EXCLUDED.tracking_specs,
            ad_active_time = EXCLUDED.ad_active_time,
            omni_business_id = EXCLUDED.omni_business_id;
    `;
    const values = [
        facebookAdData.id, facebookAdData.adset_id, facebookAdData.campaign_id, "act_" + facebookAdData.account_id, 
        facebookAdData.name, facebookAdData.configured_status, facebookAdData.created_time, 
        facebookAdData.creative, facebookAdData.effective_status, facebookAdData.last_updated_by_app_id, 
        facebookAdData.preview_shareable_link, facebookAdData.source_ad, `{${facebookAdData.source_ad_id}}`, 
        facebookAdData.status, JSON.stringify(facebookAdData.tracking_specs), facebookAdData.ad_active_time, facebookAdData.omni_business_id
    ];
    try {
        await postgres.query(query, values);
        console.log(`Ad ${facebookAdData.id} inserted or updated successfully`);
    } catch (error) {
        console.error('Error inserting data:', error);
        if (error.message.includes("violates foreign key constraint")) {
            console.log('Skipping insertion due to missing foreign key:', error.detail);
        }
    }
}

async function populateAdsMain(postgres, omniBusinessId, fb_adAccountID, accessToken) {
   
    try { 
        const facebookAdData = await getAds(fb_adAccountID, accessToken);
        if (!facebookAdData) {
            throw new Error('No ads data fetched.');
        }
        for (let ad of facebookAdData) {
            const adData = {
                id: ad.id,
                adset_id: ad.adset_id,
                campaign_id: ad.campaign_id,
                account_id: ad.account_id,
                name: ad.name,
                configured_status: ad.configured_status,
                created_time: ad.created_time,
                creative: ad.creative,
                effective_status: ad.effective_status,
                last_updated_by_app_id: ad.last_updated_by_app_id,
                preview_shareable_link: ad.preview_shareable_link,
                source_ad: ad.source_ad,
                source_ad_id: ad.source_ad_id,
                status: ad.status,
                tracking_specs: ad.tracking_specs,
                ad_active_time: ad.ad_active_time,
                omni_business_id: omniBusinessId
            };
            
            await populateAds(adData, postgres);
        }
    } catch (error) {
        console.error('Error during operation:', error);
    } 
}

// main().catch(error => {
//     console.error('Unhandled error:', error);
//     process.exit(1);
// });
module.exports = populateAdsMain;