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

        // Dynamically adjust waiting based on usage
        const maxUsage = Math.max(call_count, total_cputime, total_time);
        console.log(`PopulateAdCreative.js: API USAGE ${maxUsage}%`);

        if (response.status == 400 || response.status == 500) {
            if (retryCount < maxRetries) {
                console.log(`PopulateAdCreative.js: Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
                await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
                return fetchWithRateLimit(url, params, fb_adAccountID, retryCount + 1, maxRetries);
            } else {
                console.log(`PopulateAdCreative.js: Failed after ${maxRetries} retries.`);
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

                console.log(`PopulateAdCreative.js: Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
                await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
                return fetchWithRateLimit(url, params, fb_adAccountID, retryCount + 1, maxRetries);
            } else {
                console.log(`PopulateAdCreative.js: Failed after ${maxRetries} retries.`);
                throw new Error(`Failed after ${maxRetries} retries.`);
            }
        } else {
            console.log(`PopulateAdCreative.js: Encountered unexpected error.`, error);
            throw error;
        }
    }
}


async function getAdCreatives(fb_adAccountID, accessToken, activeOnly) {
    const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/ads`;
    const fields = 'campaign_id,adcreatives{id,authorization_category,body,branded_content,call_to_action_type,account_id,categorization_criteria,category_media_source,degrees_of_freedom_spec,effective_instagram_media_id,effective_instagram_story_id,effective_object_story_id,facebook_branded_content,image_crops,image_hash,image_url,instagram_branded_content,instagram_permalink_url,instagram_story_id,instagram_user_id,instagram_actor_id,link_url,name,object_id,object_store_url,object_type,recommender_settings,status,template_url,thumbnail_id,thumbnail_url,title,url_tags,video_id}';

    try {
        allData = [];
        let url = apiUrl;
        let params = {
            fields: fields,
            access_token: accessToken,
            limit: 200
        };

        // if (activeOnly) {
        //     params['filtering'] = '[{"field":"status","operator":"IN","value":["ACTIVE"]}]';
        // }

        let i = 0;
        do {
            i++
            console.log('Fetching creatives: ' + i + ' => Retreived creatives: ' + allData.length)
            const data = await fetchWithRateLimit(url, params, fb_adAccountID);
            //console.log('API Response:', data); // Log the full response
            if (data && data.data) {
                allData.push(...data.data);
            } else {
                console.error('PopulateAdCreative.js: No data field in response:', data);
                break;
            }
            url = data.paging?.next;
            params = {}; // Next page URL includes all required parameters
        } while (url);
  
        return allData;
    } catch (error) {
        console.error('PopulateAdCreative.js: Error fetching data:', error);
    }
}

  

async function populateAdCreatives(facebookCreativesData, postgres) {
    const query = `
        INSERT INTO fb_ad_creative (
            ad_creative_id, ad_id, campaign_id, account_id, name, degrees_of_freedom_spec, effective_instagram_media_id, effective_object_story_id,
            instagram_permalink_url, instagram_user_id, instagram_actor_id, object_type, status, thumbnail_id, thumbnail_url, title, url_tags,
            authorization_category, body, call_to_action_type, omni_business_id) 
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (ad_creative_id) DO UPDATE SET
            ad_id = EXCLUDED.ad_id,
            campaign_id = EXCLUDED.campaign_id,
            account_id = EXCLUDED.account_id,
            name = EXCLUDED.name,
            degrees_of_freedom_spec = EXCLUDED.degrees_of_freedom_spec,
            effective_instagram_media_id = EXCLUDED.effective_instagram_media_id,
            effective_object_story_id = EXCLUDED.effective_object_story_id,
            instagram_permalink_url = EXCLUDED.instagram_permalink_url,
            instagram_user_id = EXCLUDED.instagram_user_id,
            instagram_actor_id = EXCLUDED.instagram_actor_id,
            object_type = EXCLUDED.object_type,
            status = EXCLUDED.status,
            thumbnail_id = EXCLUDED.thumbnail_id,
            thumbnail_url = EXCLUDED.thumbnail_url,
            title = EXCLUDED.title,
            url_tags = EXCLUDED.url_tags,
            authorization_category = EXCLUDED.authorization_category,
            body = EXCLUDED.body,
            call_to_action_type = EXCLUDED.call_to_action_type,
            omni_business_id = EXCLUDED.omni_business_id;
    `;
    const values = [
        facebookCreativesData.ad_creative_id, facebookCreativesData.ad_id, facebookCreativesData.campaign_id, facebookCreativesData.account_id,
        facebookCreativesData.name, facebookCreativesData.degrees_of_freedom_spec, facebookCreativesData.effective_instagram_media_id, facebookCreativesData.effective_object_story_id,
        facebookCreativesData.instagram_permalink_url, facebookCreativesData.instagram_user_id, facebookCreativesData.instagram_actor_id, facebookCreativesData.object_type,
        facebookCreativesData.status, facebookCreativesData.thumbnail_id, facebookCreativesData.thumbnail_url, facebookCreativesData.title,
        facebookCreativesData.url_tags, facebookCreativesData.authorization_category, facebookCreativesData.body, facebookCreativesData.call_to_action_type,
        facebookCreativesData.omni_business_id,
    ];
    try {
        await postgres.query(query, values);
        console.log(`PopulateAdCreative.js: Ad Creative ${facebookCreativesData.ad_creative_id} has been successfully inserted or updated.`);
    } catch (error) {
        console.error('PopulateAdCreative.js: Error inserting or updating ad creative:', error);
        
    }
}

async function populateAdCreativesMain(postgres, omniBusinessId, fb_adAccountID, accessToken, activeOnly) {
    const facebookCreativesData = await getAdCreatives(fb_adAccountID, accessToken, activeOnly);
    //console.log('Ad Creatives Data:', facebookCreativesData); // Log the full response

    // Early exit if data is missing or invalid
    if (!facebookCreativesData) {
        console.error('PopulateAdCreative.js: Invalid or missing creative data');
        return;
    }

    for (const ad of facebookCreativesData) {
        if (!ad.adcreatives || !ad.adcreatives.data) continue; // Skip if no ad creatives or data is undefined

        for (const creative of ad.adcreatives.data) {
            const creativeData = {
                ad_id: ad.id,
                campaign_id: ad.campaign_id, // Assuming 'campaign_id' is also part of the ad object
                ad_creative_id: creative.id,
                account_id: creative.account_id,
                name: creative.name,
                degrees_of_freedom_spec: creative.degrees_of_freedom_spec,
                effective_instagram_media_id: creative.effective_instagram_media_id,
                effective_object_story_id: creative.effective_object_story_id,
                instagram_permalink_url: creative.instagram_permalink_url,
                instagram_user_id: creative.instagram_user_id,
                instagram_actor_id: creative.instagram_actor_id,
                object_type: creative.object_type,
                status: creative.status,
                thumbnail_id: creative.thumbnail_id,
                thumbnail_url: creative.thumbnail_url,
                title: creative.title,
                url_tags: creative.url_tags,
                authorization_category: creative.authorization_category,
                body: creative.body,
                call_to_action_type: creative.call_to_action_type,
                omni_business_id: omniBusinessId
            };

            try {
                // Logging the creative data can be uncommented for debugging purposes
                // console.log(creativeData);
                await populateAdCreatives(creativeData, postgres);

              
            } catch (error) {
                console.error(`PopulateAdCreative.js: Error inserting or updating creative ${creative.id}:`, error);
            }
        }
    }
}


module.exports = populateAdCreativesMain;