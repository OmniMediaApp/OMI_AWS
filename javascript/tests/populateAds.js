require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');





const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRateLimit(url, params, fb_adAccountID, retryCount = 0, maxRetries = 3) {
    const account_id = fb_adAccountID.split('_')[1];

    try {
        const response = await axios.get(url, { params });

        const adAccountUsage = response.headers['x-business-use-case-usage'];
        const usageData = JSON.parse(adAccountUsage);
        const { call_count, total_cputime, total_time, estimated_time_to_regain_access } = usageData[account_id][0];
        const maxUsage = Math.max(call_count, total_cputime, total_time);
        console.log(`PopulateAds.js: API USAGE ${maxUsage}%`);

        if (response.status == 400 || response.status == 500) {
            if (retryCount < maxRetries) {
                console.log(`PopulateAds.js: Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
                await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
                return fetchWithRateLimit(url, params, fb_adAccountID, retryCount + 1, maxRetries);
            } else {
                console.log(`PopulateAds.js: Failed after ${maxRetries} retries.`);
                throw new Error(`Failed after ${maxRetries} retries.`);
            }
        } else {
            return response.data;
        }
    } catch (error) {
        if (error.response && (error.response.status == 400 || error.response.status == 500)) {
            if (retryCount < maxRetries) {
                const adAccountUsage = error.response.headers['x-business-use-case-usage'];
                const usageData = JSON.parse(adAccountUsage);
                const { estimated_time_to_regain_access } = usageData[account_id][0];

                console.log(`PopulateAds.js: Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
                await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
                return fetchWithRateLimit(url, params, fb_adAccountID, retryCount + 1, maxRetries);
            } else {
                console.log(`PopulateAds.js: Failed after ${maxRetries} retries.`);
                throw new Error(`Failed after ${maxRetries} retries.`);
            }
        } else {
            console.log(`PopulateAds.js: Encountered unexpected error.`, error);
            throw error;
        }
    }
}

async function getAds(fb_adAccountID, accessToken) {
    const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/ads`;
    const fields = 'account_id,ad_active_time,ad_review_feedback,ad_schedule_end_time,ad_schedule_start_time,adset_id,campaign_id,configured_status,conversion_domain,created_time,creative,id,effective_status,bid_amount,last_updated_by_app_id,name,preview_shareable_link,recommendations,source_ad,source_ad_id,status,tracking_specs,updated_time,adcreatives{id}';
    let allData = [];
    let nextPageUrl = apiUrl;
    let params = {
        fields: fields,
        access_token: accessToken,
        limit: 200
    };

  
        let i = 0;
        do {
            i++;
            console.log('Fetching ads: ' + i + ' => Retreived ads: ' + allData.length)
            const response = await fetchWithRateLimit(nextPageUrl, params,fb_adAccountID);
            //console.log('API Response:', response); // Log the full response
            if (response.data) {
                 allData.push(...response.data); // Collect all ad data across pages
                nextPageUrl = response.paging?.next; // Update the URL to the next page if available
                params = {}; // Clear parameters since the next URL will contain them if needed
            } else {
                console.error('PopulateAds.js: No data field in response:', response);
                break; // Exit if no data is found
            }
        } while (nextPageUrl);


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
            throw new Error('PopulateAds.js: No ads data fetched.');
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
        console.error('PopulateAds.js: Error during operation:', error);
    } 
}

// main().catch(error => {
//     console.error('Unhandled error:', error);
//     process.exit(1);
// });
module.exports = populateAdsMain;