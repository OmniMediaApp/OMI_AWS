const axios = require('axios');



async function populateFacebookInsightsMain (db, postgres, req, res) {
    try {
        console.log('populating facebook insights main running')
        const account_id = req.query.account_id;
        const omni_business_id = req.query.omni_business_id;
        const access_token = req.query.access_token;
        const insightsData = await getFacebookAdInsights(account_id, access_token)
        console.log('facebook insights received')


        for (let i = 0; i < insightsData.length; i++) {
            await populateFacebookInsights(postgres, insightsData[i], omni_business_id);
        }
    } catch (error) {
        console.log("populateFacebookInsights.js: ERROR main file", error)
    }
}





//CHANGE THIS FUNCTION TO WORK FOR FACEBOOK INSIGHTS
//USE THIS LINK TO RUN THIS FILE IN POSTMAN: http://localhost:3000/populateFacebookInsights?omni_business_id=b_zfPwbkxKMDfeO1s9fn5TejRILh34hd&account_id=act_2044655035664767&access_token=EAAMJLvHGvzkBO0IInoBM6HACLo8ATU29ssAhnHiParPFfZAXPwWAT0WJ5XzENEKoi4fms3h2uZBGyzI3TSG3LAGwE5EPLYhiFwvRmltmOADnUAPhOgj71PANzhWtLeS9LWwYkdVm3OMXRsKUHkiuCQdTPmJBQBnrc12iS0Mxy5zmXt2CMUjCQKZAV9IEBqTLMffmIWRNqmdqTIkYmvZBZA4ZA0cf2CRPlkbN7I2hKyn6275yhoZCzLukDC725oZAuZBa8SjM2O3Tu2wZDZD
async function populateFacebookInsights (postgres, insightsData, omni_business_id) {
    const query = `
    INSERT INTO shopify_products
        (id, title, created_at, status, tags, online_store_url, online_store_preview_url, updated_at, description, omni_business_id) 
    VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        created_at = EXCLUDED.created_at,
        status = EXCLUDED.status,
        tags = EXCLUDED.tags,
        online_store_url = EXCLUDED.online_store_url,
        online_store_preview_url = EXCLUDED.online_store_preview_url,
        updated_at = EXCLUDED.updated_at,
        description = EXCLUDED.description,
        omni_business_id = EXCLUDED.omni_business_id;

    `;

    const values = [
        product.id.split('/').pop(),
        product.title,
        product.createdAt,
        product.status,
        product.tags,
        product.onlineStoreUrl,
        product.onlineStorePreviewUrl,
        product.updatedAt,
        product.description,
        omni_business_id,
    ];

    try {
        await postgres.query(query, values);
        console.log(`Inserted or updated Product: ${product.id} successfully`);
    } catch (error) {
        console.log("populateFacebookInsights.js: ERROR populating shopify products", error)
    }
}







async function getFacebookAdInsights(account_id, access_token) {
    const limit = 10;
    const apiUrl = `https://graph.facebook.com/v19.0/${account_id}/insights?level=ad&time_range={"since":"2024-05-15","until":"2024-05-15"}&limit=${limit}&access_token=${access_token}&fields=spend,impressions,clicks,ad_id,adset_id,campaign_id,actions,action_values,cpc,cpm,cpp,ctr,frequency`;
    console.log(apiUrl)
    let allAdInsights = [];
    let url = apiUrl;
    let retryCount = 0;
    const maxRetries = 3;

    try {
        do {
            console.log('Fetching Ad Insights => Retrieved Ad Insights: ' + allAdInsights.length);
            try {
                const response = await axios.get(url);
                allAdInsights.push(...response.data.data);
                url = response.data.paging?.next;
            } catch (error) {
                if (retryCount < maxRetries && [400, 500].includes(error.response?.status)) {
                    const waitTime = ((error.response?.headers['x-business-use-case-usage'] || "{}")?.[fb_adAccountID.split('_')[1]]?.[0]?.estimated_time_to_regain_access || 1) * 1000 * 60;
                    console.log(`Access temporarily blocked. Waiting for ${waitTime / (1000 * 60)} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
                    await sleep(waitTime);
                    retryCount++;
                } else {
                    console.error('Encountered unexpected error:', error);
                    throw error;
                }
            }
        } while (url);
    } catch (error) {
        console.error('Error fetching Facebook insights:', error);
        throw error;
    }
  
    return allAdInsights;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}






module.exports = populateFacebookInsightsMain;
