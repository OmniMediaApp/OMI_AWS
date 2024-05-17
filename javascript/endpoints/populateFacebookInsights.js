const axios = require('axios');



async function populateFacebookInsightsMain (postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken) {
    try {
        console.log('populating facebook insights main running')
        const account_id = fb_adAccountID;
        const omni_business_id = omniBusinessId;
        const access_token = accessToken;
        const insightsData = await getFacebookAdInsights(account_id, access_token)
        if (!insightsData) {
            console.log('populateFacebookInsights.js: ERROR insights data not received')
            return res.status(400).send('insights data not received')
        }else{
        console.log('facebook insights received')
        }


        for (const adInsight of insightsData) {
            
            await populateFacebookInsights(postgres, adInsight, omni_business_id);
        }
    } catch (error) {
        console.log("populateFacebookInsights.js: ERROR main file", error)
    }
}





//CHANGE THIS FUNCTION TO WORK FOR FACEBOOK INSIGHTS
//USE THIS LINK TO RUN THIS FILE IN POSTMAN: http://localhost:3000/populateFacebookInsights?omni_business_id=b_zfPwbkxKMDfeO1s9fn5TejRILh34hd&account_id=act_2044655035664767&access_token=EAAMJLvHGvzkBO0IInoBM6HACLo8ATU29ssAhnHiParPFfZAXPwWAT0WJ5XzENEKoi4fms3h2uZBGyzI3TSG3LAGwE5EPLYhiFwvRmltmOADnUAPhOgj71PANzhWtLeS9LWwYkdVm3OMXRsKUHkiuCQdTPmJBQBnrc12iS0Mxy5zmXt2CMUjCQKZAV9IEBqTLMffmIWRNqmdqTIkYmvZBZA4ZA0cf2CRPlkbN7I2hKyn6275yhoZCzLukDC725oZAuZBa8SjM2O3Tu2wZDZD
async function populateFacebookInsights(postgres, adInsight, omni_business_id) {
    const query = `
    INSERT INTO fb_ad_insights
        (ad_id, adset_id, campaign_id, account_id, spend, impressions, clicks, cpc, cpm, cpp, ctr, frequency,
         omni_add_to_cart, omni_initiated_checkout, onsite_web_app_view_content, landing_page_view, onsite_web_app_add_to_cart,
         view_content, onsite_web_purchase, onsite_conversion_post_save, onsite_web_app_purchase, page_engagement,
         purchase, onsite_web_add_to_cart, post_engagement, post, onsite_web_view_content, add_to_cart, video_view,
         omni_view_content, offsite_conversion_fb_pixel_view_content, post_reaction, offsite_conversion_fb_pixel_add_to_cart,
         offsite_conversion_fb_pixel_initiate_checkout, offsite_conversion_fb_pixel_purchase, initiate_checkout, link_click,
         omni_purchase, value_onsite_web_app_purchase, value_onsite_web_app_add_to_cart, value_onsite_web_add_to_cart,
         value_omni_purchase, value_omni_add_to_cart, value_initiate_checkout, value_offsite_conversion_fb_pixel_purchase,
         value_offsite_conversion_fb_pixel_initiate_checkout, value_offsite_conversion_fb_pixel_view_content,
         value_onsite_web_purchase, value_offsite_conversion_fb_pixel_add_to_cart, value_omni_initiated_checkout,
         value_onsite_web_app_view_content, value_onsite_web_view_content, value_add_to_cart, date, omni_business_id, db_updated_at)
    VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57)
    ON CONFLICT (ad_id) DO UPDATE SET 
        adset_id = EXCLUDED.adset_id,
        campaign_id = EXCLUDED.campaign_id,
        account_id = EXCLUDED.account_id,
        spend = EXCLUDED.spend,
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        cpc = EXCLUDED.cpc,
        cpm = EXCLUDED.cpm,
        cpp = EXCLUDED.cpp,
        ctr = EXCLUDED.ctr,
        frequency = EXCLUDED.frequency,
        omni_add_to_cart = EXCLUDED.omni_add_to_cart,
        omni_initiated_checkout = EXCLUDED.omni_initiated_checkout,
        onsite_web_app_view_content = EXCLUDED.onsite_web_app_view_content,
        landing_page_view = EXCLUDED.landing_page_view,
        onsite_web_app_add_to_cart = EXCLUDED.onsite_web_app_add_to_cart,
        view_content = EXCLUDED.view_content,
        onsite_web_purchase = EXCLUDED.onsite_web_purchase,
        onsite_conversion_post_save = EXCLUDED.onsite_conversion_post_save,
        onsite_web_app_purchase = EXCLUDED.onsite_web_app_purchase,
        page_engagement = EXCLUDED.page_engagement,
        purchase = EXCLUDED.purchase,
        onsite_web_add_to_cart = EXCLUDED.onsite_web_add_to_cart,
        post_engagement = EXCLUDED.post_engagement,
        post = EXCLUDED.post,
        onsite_web_view_content = EXCLUDED.onsite_web_view_content,
        add_to_cart = EXCLUDED.add_to_cart,
        video_view = EXCLUDED.video_view,
        omni_view_content = EXCLUDED.omni_view_content,
        offsite_conversion_fb_pixel_view_content = EXCLUDED.offsite_conversion_fb_pixel_view_content,
        post_reaction = EXCLUDED.post_reaction,
        offsite_conversion_fb_pixel_add_to_cart = EXCLUDED.offsite_conversion_fb_pixel_add_to_cart,
        offsite_conversion_fb_pixel_initiate_checkout = EXCLUDED.offsite_conversion_fb_pixel_initiate_checkout,
        offsite_conversion_fb_pixel_purchase = EXCLUDED.offsite_conversion_fb_pixel_purchase,
        initiate_checkout = EXCLUDED.initiate_checkout,
        link_click = EXCLUDED.link_click,
        omni_purchase = EXCLUDED.omni_purchase,
        value_onsite_web_app_purchase = EXCLUDED.value_onsite_web_app_purchase,
        value_onsite_web_app_add_to_cart = EXCLUDED.value_onsite_web_app_add_to_cart,
        value_onsite_web_add_to_cart = EXCLUDED.value_onsite_web_add_to_cart,
        value_omni_purchase = EXCLUDED.value_omni_purchase,
        value_omni_add_to_cart = EXCLUDED.value_omni_add_to_cart,
        value_initiate_checkout = EXCLUDED.value_initiate_checkout,
        value_offsite_conversion_fb_pixel_purchase = EXCLUDED.value_offsite_conversion_fb_pixel_purchase,
        value_offsite_conversion_fb_pixel_initiate_checkout = EXCLUDED.value_offsite_conversion_fb_pixel_initiate_checkout,
        value_offsite_conversion_fb_pixel_view_content = EXCLUDED.value_offsite_conversion_fb_pixel_view_content,
        value_onsite_web_purchase = EXCLUDED.value_onsite_web_purchase,
        value_offsite_conversion_fb_pixel_add_to_cart = EXCLUDED.value_offsite_conversion_fb_pixel_add_to_cart,
        value_omni_initiated_checkout = EXCLUDED.value_omni_initiated_checkout,
        value_onsite_web_app_view_content = EXCLUDED.value_onsite_web_app_view_content,
        value_onsite_web_view_content = EXCLUDED.value_onsite_web_view_content,
        value_add_to_cart = EXCLUDED.value_add_to_cart,
        date = EXCLUDED.date,
        omni_business_id = EXCLUDED.omni_business_id,
        db_updated_at = EXCLUDED.db_updated_at;
    `;
	
    try {
        await postgres.query(query, [
            adInsight.ad_id, adInsight.adset_id, adInsight.campaign_id, adInsight.account_id, adInsight.spend,
            adInsight.impressions, adInsight.clicks, adInsight.cpc, adInsight.cpm, adInsight.cpp, adInsight.ctr,
            adInsight.frequency, 
            adInsight.actions.find(a => a.action_type === "omni_add_to_cart")?.value || 0,
            adInsight.actions.find(a => a.action_type === "omni_initiated_checkout")?.value || 0,
            adInsight.actions.find(a => a.action_type === "onsite_web_app_view_content")?.value || 0,
            adInsight.actions.find(a => a.action_type === "landing_page_view")?.value || 0,
            adInsight.actions.find(a => a.action_type === "onsite_web_app_add_to_cart")?.value || 0,
            adInsight.actions.find(a => a.action_type === "view_content")?.value || 0,
            adInsight.actions.find(a => a.action_type === "onsite_web_purchase")?.value || 0,
            adInsight.actions.find(a => a.action_type === "onsite_conversion.post_save")?.value || 0,
            adInsight.actions.find(a => a.action_type === "onsite_web_app_purchase")?.value || 0,
            adInsight.actions.find(a => a.action_type === "page_engagement")?.value || 0,
            adInsight.actions.find(a => a.action_type === "purchase")?.value || 0,
            adInsight.actions.find(a => a.action_type === "onsite_web_add_to_cart")?.value || 0,
            adInsight.actions.find(a => a.action_type === "post_engagement")?.value || 0,
            adInsight.actions.find(a => a.action_type === "post")?.value || 0,
            adInsight.actions.find(a => a.action_type === "onsite_web_view_content")?.value || 0,
            adInsight.actions.find(a => a.action_type === "add_to_cart")?.value || 0,
            adInsight.actions.find(a => a.action_type === "video_view")?.value || 0,
            adInsight.actions.find(a => a.action_type === "omni_view_content")?.value || 0,
            adInsight.actions.find(a => a.action_type === "offsite_conversion.fb_pixel_view_content")?.value || 0,
            adInsight.actions.find(a => a.action_type === "post_reaction")?.value || 0,
            adInsight.actions.find(a => a.action_type === "offsite_conversion.fb_pixel_add_to_cart")?.value || 0,
            adInsight.actions.find(a => a.action_type === "offsite_conversion.fb_pixel_initiate_checkout")?.value || 0,
            adInsight.actions.find(a => a.action_type === "offsite_conversion.fb_pixel_purchase")?.value || 0,
            adInsight.actions.find(a => a.action_type === "initiate_checkout")?.value || 0,
            adInsight.actions.find(a => a.action_type === "link_click")?.value || 0,
            adInsight.actions.find(a => a.action_type === "omni_purchase")?.value || 0,
            // Values for monetary actions
            adInsight.action_values.find(v => v.action_type === "onsite_web_app_purchase")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "onsite_web_app_add_to_cart")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "onsite_web_add_to_cart")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "omni_purchase")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "omni_add_to_cart")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "initiate_checkout")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "offsite_conversion.fb_pixel_purchase")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "offsite_conversion.fb_pixel_initiate_checkout")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "view_content")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "purchase")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "offsite_conversion.fb_pixel_view_content")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "onsite_web_purchase")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "offsite_conversion.fb_pixel_add_to_cart")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "omni_view_content")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "omni_initiated_checkout")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "onsite_web_app_view_content")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "onsite_web_view_content")?.value || 0,
            adInsight.action_values.find(v => v.action_type === "add_to_cart")?.value || 0,
            adInsight.date_start,
            omni_business_id,  // assuming db_updated_at should be the current timestamp
            new Date().toISOString()
        ]);
        console.log(`Inserted or updated ad insight: ${adInsight.ad_id} successfully`);
    } catch (error) {
        console.log("Error in populateFacebookInsights function", error);
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
    let i = 0;
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
            i++;
        } while (url && i < 3);
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
