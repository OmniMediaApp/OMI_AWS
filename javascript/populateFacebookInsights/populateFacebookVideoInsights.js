const axios = require('axios');

async function populateFacebookVideoInsightsMain(postgres, omniBusinessId, fb_businessID, fb_adAccountID, fb_access_token, date_count) {
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
            const insightsData = await getFacebookVideoInsights(campaign_id, access_token, date_start, date_count);

            if (!insightsData) {
                console.log('populateFacebookvideoInsights.js: ERROR insights data not received');
                return;
            } else {
                console.log('Facebook insights received');
                const batchSize = 10;
                for (let i = 0; i < insightsData.length; i += batchSize) {
                    const insightsBatch = insightsData.slice(i, i + batchSize);
                    await populateFacebookvideoInsights(postgres, insightsBatch, omni_business_id, fb_adAccountID);
                }
            }
        }
    } catch (error) {
        console.log("populateFacebookvideoInsights.js: ERROR main file", error);
    }
}

async function getFacebookVideoInsights(campaign_id, access_token, date_start, day_count) {
    let allAdInsights = [];

    for (let i = 0; i < day_count; i++) {
        const date = new Date(date_start);
        date.setDate(date.getDate() - (i + 1));
        const formattedDate = date.toISOString().split('T')[0];
        const limit = 10;
        const apiUrl = `https://graph.facebook.com/v19.0/${campaign_id}/insights?access_token=${access_token}&breakdowns=video_asset&fields=account_id,campaign_id,spend,impressions,clicks,actions,action_values,cpc,cpm,cpp,ctr,reach,frequency&time_range={"since":"${formattedDate}","until":"${formattedDate}"}&limit=${limit}`;

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
            console.error('Error fetching Facebook video insights:', error);
            throw error;
        }
    }
    return allAdInsights;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateFacebookvideoInsights(postgres, insightsBatch, omni_business_id, account_id) {
    const query = `
    INSERT INTO fb_ad_videos_insights
        (video_id, video_asset_id, campaign_id, account_id, spend, impressions, clicks, cpc, cpm, cpp, ctr, frequency,
         omni_add_to_cart, omni_initiated_checkout, onsite_web_app_view_content, landing_page_view, onsite_web_app_add_to_cart,
         view_content, onsite_web_purchase, onsite_conversion_post_save, onsite_web_app_purchase, page_engagement,
         purchase, onsite_web_add_to_cart, post_engagement, post, onsite_web_view_content, add_to_cart, video_view,
         omni_view_content, offsite_conversion_fb_pixel_view_content, post_reaction, offsite_conversion_fb_pixel_add_to_cart,
         offsite_conversion_fb_pixel_initiate_checkout, offsite_conversion_fb_pixel_purchase, initiate_checkout, link_click,
         omni_purchase, value_onsite_web_app_purchase, value_onsite_web_app_add_to_cart, value_onsite_web_add_to_cart,
         value_omni_purchase, value_omni_add_to_cart, value_initiate_checkout, value_offsite_conversion_fb_pixel_purchase,
         value_offsite_conversion_fb_pixel_initiate_checkout, value_view_content, value_purchase, value_offsite_conversion_fb_pixel_view_content,
         value_onsite_web_purchase, value_offsite_conversion_fb_pixel_add_to_cart, value_omni_view_content, value_omni_initiated_checkout,
         value_onsite_web_app_view_content, value_onsite_web_view_content, value_add_to_cart, date, omni_business_id)
    VALUES 
    ${insightsBatch.map((_, i) => `(
        $${i * 58 + 1}, $${i * 58 + 2}, $${i * 58 + 3}, $${i * 58 + 4}, $${i * 58 + 5}, $${i * 58 + 6}, $${i * 58 + 7}, $${i * 58 + 8}, $${i * 58 + 9}, $${i * 58 + 10}, 
        $${i * 58 + 11}, $${i * 58 + 12}, $${i * 58 + 13}, $${i * 58 + 14}, $${i * 58 + 15}, $${i * 58 + 16}, $${i * 58 + 17}, $${i * 58 + 18}, $${i * 58 + 19}, $${i * 58 + 20}, 
        $${i * 58 + 21}, $${i * 58 + 22}, $${i * 58 + 23}, $${i * 58 + 24}, $${i * 58 + 25}, $${i * 58 + 26}, $${i * 58 + 27}, $${i * 58 + 28}, $${i * 58 + 29}, $${i * 58 + 30}, 
        $${i * 58 + 31}, $${i * 58 + 32}, $${i * 58 + 33}, $${i * 58 + 34}, $${i * 58 + 35}, $${i * 58 + 36}, $${i * 58 + 37}, $${i * 58 + 38}, $${i * 58 + 39}, $${i * 58 + 40}, 
        $${i * 58 + 41}, $${i * 58 + 42}, $${i * 58 + 43}, $${i * 58 + 44}, $${i * 58 + 45}, $${i * 58 + 46}, $${i * 58 + 47}, $${i * 58 + 48}, $${i * 58 + 49}, $${i * 58 + 50}, 
        $${i * 58 + 51}, $${i * 58 + 52}, $${i * 58 + 53}, $${i * 58 + 54}, $${i * 58 + 55}, $${i * 58 + 56}, $${i * 58 + 57}, $${i * 58 + 58}
    )`).join(', ')}
    ON CONFLICT (video_id, date) DO UPDATE SET 
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
        value_view_content = EXCLUDED.value_view_content,
        value_purchase = EXCLUDED.value_purchase,
        value_offsite_conversion_fb_pixel_view_content = EXCLUDED.value_offsite_conversion_fb_pixel_view_content,
        value_onsite_web_purchase = EXCLUDED.value_onsite_web_purchase,
        value_offsite_conversion_fb_pixel_add_to_cart = EXCLUDED.value_offsite_conversion_fb_pixel_add_to_cart,
        value_omni_view_content = EXCLUDED.value_omni_view_content,
        value_omni_initiated_checkout = EXCLUDED.value_omni_initiated_checkout,
        value_onsite_web_app_view_content = EXCLUDED.value_onsite_web_app_view_content,
        value_onsite_web_view_content = EXCLUDED.value_onsite_web_view_content,
        value_add_to_cart = EXCLUDED.value_add_to_cart,
        date = EXCLUDED.date,
        omni_business_id = EXCLUDED.omni_business_id;
    `;

    const values = insightsBatch.flatMap(adInsight => [
        adInsight.video_asset.video_id, adInsight.video_asset.id, adInsight.campaign_id, account_id, adInsight.spend,
        adInsight.impressions, adInsight.clicks, adInsight.cpc, adInsight.cpm, adInsight.cpp, adInsight.ctr,
        adInsight.frequency, 
        adInsight.actions?.find(a => a.action_type === "omni_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "omni_initiated_checkout")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_app_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "landing_page_view")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_app_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_conversion.post_save")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_app_purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "page_engagement")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "post_engagement")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "post")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "onsite_web_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "video_view")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "omni_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_view_content")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "post_reaction")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_add_to_cart")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_initiate_checkout")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_purchase")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "initiate_checkout")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "link_click")?.value || 0,
        adInsight.actions?.find(a => a.action_type === "omni_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_app_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_app_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "omni_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "omni_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "initiate_checkout")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_initiate_checkout")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "view_content")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_view_content")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "onsite_web_purchase")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "offsite_conversion.fb_pixel_add_to_cart")?.value || 0,
        adInsight.action_values?.find(v => v.action_type === "omni_view_content")?.value || 0,
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

module.exports = populateFacebookVideoInsightsMain;
