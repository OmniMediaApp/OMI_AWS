const axios = require('axios');

async function populateFacebookImageInsightsMain(postgres, omniBusinessId, fb_businessID, fb_adAccountID, fb_access_token, date_count) {
    try {
        const access_token = fb_access_token;
        const omni_business_id = omniBusinessId;
        const date_start = new Date();
        console.log('date_start:', date_start);

        const campaignIds = await postgres.query('SELECT campaign_id FROM fb_campaign_insights WHERE omni_business_id = $1', [omniBusinessId]);
        console.log('campaignIds:', campaignIds.rows);
        if (campaignIds.rows.length === 0) {
            console.log('No campaign IDs found for the given omni_business_id.');
            return;
        }

        for (const campaignId of campaignIds.rows) {
            const campaign_id = campaignId.campaign_id;
            const insightsData = await getFacebookImageInsights(campaign_id, access_token, date_start, date_count);

            if (!insightsData) {
                console.log('populateFacebookImageInsights.js: ERROR insights data not received');
                return;
            } else {
                console.log('Facebook insights received');
                const batchSize = 10;
                for (let i = 0; i < insightsData.length; i += batchSize) {
                    const insightsBatch = insightsData.slice(i, i + batchSize);
                    await insertFacebookImageInsights(postgres, insightsBatch, omni_business_id, fb_adAccountID);
                }
            }
        }
    } catch (error) {
        console.log("populateFacebookImageInsights.js: ERROR main file", error);
    }
}

async function getFacebookImageInsights(campaign_id, access_token, date_start, day_count) {
    let allAdInsights = [];

    for (let i = 0; i < day_count; i++) {
        const date = new Date(date_start);
        date.setDate(date.getDate() - (i + 1));
        const formattedDate = date.toISOString().split('T')[0];
        const limit = 10;
        const apiUrl = `https://graph.facebook.com/v19.0/${campaign_id}/insights?access_token=${access_token}&breakdowns=image_asset&fields=account_id,campaign_id,spend,impressions,clicks,actions,action_values,cpc,cpm,cpp,ctr,reach,frequency&time_range={"since":"${formattedDate}","until":"${formattedDate}"}&limit=${limit}`;

        let url = apiUrl;
        let retryCount = 0;
        const maxRetries = 3;

        try {
            do {
                console.log('Fetching Ad Insights => Retrieved Ad Insights: ' + formattedDate + " " + allAdInsights.length);
                try {
                    const response = await axios.get(url);
                    allAdInsights.push(...response.data.data);
                    url = response.data.paging?.next;
                } catch (error) {
                    if (retryCount < maxRetries && [400, 500].includes(error.response?.status)) {
                        const waitTime = ((error.response?.headers['x-business-use-case-usage'] || "{}")?.[campaign_id.split('_')[1]]?.[0]?.estimated_time_to_regain_access || 1) * 1000 * 60;
                        console.log(`Access temporarily blocked. Waiting for ${waitTime / (1000 * 60)} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
                        console.log(error.response.status)
                        console.log(error.response.data)
                        await sleep(waitTime);
                        retryCount++;
                    } else {
                        console.error('Encountered unexpected error:', error.response?.data?.error?.message || error.message);
                        throw error;
                    }
                }
            } while (url);
        } catch (error) {
            console.error('Error fetching Facebook images insights:', error);
            throw error;
        }
    }
    return allAdInsights;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function insertFacebookImageInsights(postgres, insightsBatch, omni_business_id, account_id) {
    const query = `
    INSERT INTO fb_ad_images_insights
        (image_id, image_asset_id, campaign_id, account_id, url, name, spend, impressions, clicks, cpc, cpm, cpp, ctr, frequency,
         onsite_web_app_view_content, landing_page_view, onsite_conversion_post_save, onsite_web_app_purchase, page_engagement, 
         purchase, post_engagement, onsite_web_purchase, view_content, post, onsite_web_view_content, omni_view_content, 
         offsite_conversion_fb_pixel_view_content, post_reaction, offsite_conversion_fb_pixel_purchase, link_click, omni_purchase, 
         omni_add_to_cart, omni_initiated_checkout, onsite_web_app_add_to_cart, onsite_web_add_to_cart, add_to_cart, 
         offsite_conversion_fb_pixel_add_to_cart, offsite_conversion_fb_pixel_initiate_checkout, initiate_checkout, comment, 
         value_onsite_web_app_purchase, value_onsite_web_app_add_to_cart, value_onsite_web_add_to_cart, value_omni_purchase, 
         value_omni_add_to_cart, value_initiate_checkout, value_offsite_conversion_fb_pixel_purchase, value_offsite_conversion_fb_pixel_initiate_checkout, 
         value_offsite_conversion_fb_pixel_view_content, value_onsite_web_purchase, value_offsite_conversion_fb_pixel_add_to_cart, value_omni_initiated_checkout, 
         value_onsite_web_app_view_content, value_onsite_web_view_content, value_add_to_cart, date, omni_business_id, db_updated_at)
    VALUES 
    ${insightsBatch.map((_, i) => `(
        $${i * 57 + 1}, $${i * 57 + 2}, $${i * 57 + 3}, $${i * 57 + 4}, $${i * 57 + 5}, $${i * 57 + 6}, $${i * 57 + 7}, $${i * 57 + 8}, $${i * 57 + 9}, $${i * 57 + 10}, 
        $${i * 57 + 11}, $${i * 57 + 12}, $${i * 57 + 13}, $${i * 57 + 14}, $${i * 57 + 15}, $${i * 57 + 16}, $${i * 57 + 17}, $${i * 57 + 18}, $${i * 57 + 19}, $${i * 57 + 20}, 
        $${i * 57 + 21}, $${i * 57 + 22}, $${i * 57 + 23}, $${i * 57 + 24}, $${i * 57 + 25}, $${i * 57 + 26}, $${i * 57 + 27}, $${i * 57 + 28}, $${i * 57 + 29}, $${i * 57 + 30}, 
        $${i * 57 + 31}, $${i * 57 + 32}, $${i * 57 + 33}, $${i * 57 + 34}, $${i * 57 + 35}, $${i * 57 + 36}, $${i * 57 + 37}, $${i * 57 + 38}, $${i * 57 + 39}, $${i * 57 + 40}, 
        $${i * 57 + 41}, $${i * 57 + 42}, $${i * 57 + 43}, $${i * 57 + 44}, $${i * 57 + 45}, $${i * 57 + 46}, $${i * 57 + 47}, $${i * 57 + 48}, $${i * 57 + 49}, $${i * 57 + 50}, 
        $${i * 57 + 51}, $${i * 57 + 52}, $${i * 57 + 53}, $${i * 57 + 54}, $${i * 57 + 55}, $${i * 57 + 56}, $${i * 57 + 57}, NOW()
    )`).join(', ')}
    ON CONFLICT (image_id, date) DO UPDATE SET 
        url = EXCLUDED.url,
        name = EXCLUDED.name,
        spend = EXCLUDED.spend,
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        cpc = EXCLUDED.cpc,
        cpm = EXCLUDED.cpm,
        cpp = EXCLUDED.cpp,
        ctr = EXCLUDED.ctr,
        frequency = EXCLUDED.frequency,
        onsite_web_app_view_content = EXCLUDED.onsite_web_app_view_content,
        landing_page_view = EXCLUDED.landing_page_view,
        onsite_conversion_post_save = EXCLUDED.onsite_conversion_post_save,
        onsite_web_app_purchase = EXCLUDED.onsite_web_app_purchase,
        page_engagement = EXCLUDED.page_engagement,
        purchase = EXCLUDED.purchase,
        post_engagement = EXCLUDED.post_engagement,
        onsite_web_purchase = EXCLUDED.onsite_web_purchase,
        view_content = EXCLUDED.view_content,
        post = EXCLUDED.post,
        onsite_web_view_content = EXCLUDED.onsite_web_view_content,
        omni_view_content = EXCLUDED.omni_view_content,
        offsite_conversion_fb_pixel_view_content = EXCLUDED.offsite_conversion_fb_pixel_view_content,
        post_reaction = EXCLUDED.post_reaction,
        offsite_conversion_fb_pixel_purchase = EXCLUDED.offsite_conversion_fb_pixel_purchase,
        link_click = EXCLUDED.link_click,
        omni_purchase = EXCLUDED.omni_purchase,
        omni_add_to_cart = EXCLUDED.omni_add_to_cart,
        omni_initiated_checkout = EXCLUDED.omni_initiated_checkout,
        onsite_web_app_add_to_cart = EXCLUDED.onsite_web_app_add_to_cart,
        onsite_web_add_to_cart = EXCLUDED.onsite_web_add_to_cart,
        add_to_cart = EXCLUDED.add_to_cart,
        offsite_conversion_fb_pixel_add_to_cart = EXCLUDED.offsite_conversion_fb_pixel_add_to_cart,
        offsite_conversion_fb_pixel_initiate_checkout = EXCLUDED.offsite_conversion_fb_pixel_initiate_checkout,
        initiate_checkout = EXCLUDED.initiate_checkout,
        comment = EXCLUDED.comment,
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
        omni_business_id = EXCLUDED.omni_business_id,
        db_updated_at = NOW();
    `;

    const values = insightsBatch.flatMap(adInsight => [
        adInsight.image_asset.hash, 
        adInsight.image_asset.id, 
        adInsight.campaign_id, 
        account_id, 
        adInsight.url, 
        adInsight.name,
        adInsight.spend,
        adInsight.impressions, 
        adInsight.clicks, 
        adInsight.cpc, 
        adInsight.cpm, 
        adInsight.cpp, 
        adInsight.ctr, 
        adInsight.frequency,
        adInsight.actions?.find(a => a.action_type === "onsite_web_app_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "landing_page_view")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_conversion.post_save")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_app_purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "page_engagement")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "post_engagement")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "post")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "omni_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "post_reaction")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "link_click")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "omni_purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "omni_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "omni_initiated_checkout")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_app_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_initiate_checkout")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "initiate_checkout")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "comment")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_app_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_app_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "omni_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "omni_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "initiate_checkout")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_initiate_checkout")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_view_content")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "omni_initiated_checkout")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_app_view_content")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_view_content")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "add_to_cart")?.value || 0,
        adInsight.date_start,
        omni_business_id
    ]);

    try {
        await postgres.query(query, values);
        console.log(`Batch inserted or updated successfully`);
    } catch (error) {
        console.error('Error inserting or updating ad insights:', error);
    }
}

module.exports = populateFacebookImageInsightsMain;
