async function getAds(postgres, req, res) {
    try {
        const adAccountID = req.query.adAccountID;
        let filterStatus = req.query.filterStatus;

        const queryParams = [adAccountID];
        let filterClause = '';

        if (filterStatus === 'active' || filterStatus === 'paused') {
            queryParams.push(`%${filterStatus}%`);
            filterClause = ' AND fb_campaign.status ILIKE $2';
        } else if (filterStatus === 'review') {
            queryParams.push('%in review%');
            filterClause = ' AND fb_campaign.status ILIKE $2';
        }

        const query = `
            SELECT 
                fb_campaign.campaign_id,
                fb_campaign.account_id,
                fb_campaign.name AS campaign_name,
                fb_campaign.status AS campaign_status,
                fb_campaign.daily_budget AS campaign_daily_budget,
                fb_adset.adset_id,
                fb_adset.name AS adset_name,
                fb_adset.daily_budget AS adset_daily_budget,
                fb_adset.status AS adset_status,
                fb_adset.targeting_automation AS adset_advantage_audience,
                fb_ad.ad_id,
                fb_ad.name AS ad_name,
                fb_ad.configured_status AS ad_configured_status,
                fb_ad.effective_status AS ad_effective_status,
                fb_ad.preview_shareable_link AS ad_link,
                fb_ad_creative.ad_creative_id,
                fb_ad_creative.name AS creative_name,
                fb_ad_creative.instagram_permalink_url AS creative_instagram_link,
                fb_ad_creative.object_type AS creative_type,
                fb_ad_creative.thumbnail_url AS creative_thumbnail_url,
                fb_ad_creative.title AS creative_title,
                fb_ad_creative.body AS creative_body,
                fb_ad_creative.call_to_action_type AS creative_cta
            FROM 
                fb_campaign
            LEFT JOIN 
                fb_adset ON fb_campaign.campaign_id = fb_adset.campaign_id
            LEFT JOIN 
                fb_ad ON fb_adset.adset_id = fb_ad.adset_id
            LEFT JOIN 
                fb_ad_creative ON fb_ad.ad_id = fb_ad_creative.ad_id
            WHERE
                fb_campaign.account_id = $1
                ${filterClause}
            ORDER BY 
                fb_campaign.campaign_id ASC;
        `;
    
    
    const result = await postgres.query(query, filterStatus !== 'any' ? [adAccountID, filterStatus] : [adAccountID]);
    const data = result.rows;
       
        
        function organizeData(data) {
            const campaigns = {};
        
            data.forEach(ad => {
                const campaignId = ad.campaign_id;
        
                if (!campaigns[campaignId]) {
                    campaigns[campaignId] = {
                        type: 'campaign',
                        campaign_id: ad.campaign_id,
                        campaign_name: ad.campaign_name,
                        campaign_status: ad.campaign_status,
                        campaign_daily_budget: ad.campaign_daily_budget,
                        adsets: []
                    };
                }
        
                const adset = {
                    type: 'adset',
                    adset_id: ad.adset_id,
                    adset_name: ad.adset_name,
                    adset_daily_budget: ad.adset_daily_budget,
                    adset_status: ad.adset_status,
                    adset_advantage_audience: ad.adset_advantage_audience,
                    ads: []
                };
        
                const adData = {
                    type: 'ad',
                    ad_id: ad.ad_id,
                    ad_name: ad.ad_name,
                    ad_configured_status: ad.ad_configured_status,
                    ad_effective_status: ad.ad_effective_status,
                    ad_link: ad.ad_link,
                    creatives: []
                };
        
                const creative = {
                    type: 'creative',
                    creative_id: ad.ad_creative_id,
                    creative_name: ad.creative_name,
                    creative_instagram_link: ad.creative_instagram_link,
                    creative_type: ad.creative_type,
                    creative_thumbnail_url: ad.creative_thumbnail_url,
                    creative_title: ad.creative_title,
                    creative_body: ad.creative_body,
                    creative_cta: ad.creative_cta
                };
        
                adData.creatives.push(creative);
                adset.ads.push(adData);
                campaigns[campaignId].adsets.push(adset);
            });
        
            return Object.values(campaigns);
        }
        
        const nestedData = organizeData(data);
        console.log(nestedData);
        

        return nestedData;
    } catch (error) {
        console.error('Error executing query getAds.js:', error);
        throw error; // rethrow the error to be handled by the caller
    }
  
  
  }





  function generateFilterStatus(status) {
    if (status === 'active' || status === 'paused') {
        return ' AND fb_campaign.status ILIKE $2';
    } else if (status === 'review') {
        return ' AND fb_campaign.status ILIKE $2';
    } else {
        return ''; // Return empty string if status is 'any'
    }
}






  module.exports = getAds;
