const { Client } = require('pg');
const axios = require('axios');


<<<<<<< Updated upstream
const dbOptions = {
    user: 'postgres',
    host: 'omnirds.cluster-chcpmc0xmfre.us-east-2.rds.amazonaws.com',
    database: 'postgres',
    password: 'Omni2023!',
    port: '5432',
  };

const client = new Client(dbOptions);

client.connect()
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Connection error', err.stack));


async function getAdsets () {
    try{
    const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
    const fields = 'ads{account_id,ad_active_time,ad_review_feedback,ad_schedule_end_time,ad_schedule_start_time,adset_id,campaign_id,configured_status,conversion_domain,created_time,creative,id,effective_status,bid_amount,last_updated_by_app_id,name,preview_shareable_link,recommendations,source_ad,source_ad_id,status,tracking_specs,updated_time,adcreatives{id}}'
    const accessToken = 'EAAMJLvHGvzkBO8B2O2ngIus8HfFhO4AbUMJR8dSjlAfkEbZB5n62VjkYIdCfv8p7nl2TXiTHlUwqlOJRI23QekFnuHUOTvppGvkU7xgQ3dYZCZCxdH43ZCYS3lrBOnABSDb3hCrbnRrICE8d126F4MGs3HWku6CvqKpCerjtaOqgkychgm0qz4xzNSRO64EY2LRJ0ogRi6bZAjBpKxO9zyoVoyAZDZD'
    
    
    const response = await axios.get(apiUrl, {
=======


// AWS RDS POSTGRESQL INSTANCE
const dbOptions = {
  user: 'postgres',
  host: 'omnirds.cluster-chcpmc0xmfre.us-east-2.rds.amazonaws.com',
  database: 'postgres',
  password: 'Omni2023!',
  port: '5432',
};

// Create a new PostgreSQL client
const client = new Client(dbOptions);

// Connect to the PostgreSQL database
client.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Connection error', err.stack));




  


  async function getCampaigns () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
      const fields = 'ads{account_id,ad_active_time,ad_review_feedback,ad_schedule_end_time,ad_schedule_start_time,adset_id,campaign_id,configured_status,conversion_domain,created_time,creative,id,effective_status,bid_amount,last_updated_by_app_id,name,preview_shareable_link,recommendations,source_ad,source_ad_id,status,tracking_specs,updated_time,adcreatives{id}}';
      const accessToken = 'EAAMJLvHGvzkBO7XFdUP87UehMCTSH0JUpxbBUNmmddMLrPx18ltodOEXa9DXZBASRlRQJVQPpRZBfRtyZAzZCoONjWZCRjM8iuCMobb38v6QkMzgub5ZB72trsOEAEBZCYoLekRjGkYxdWm7p4xEpwAcuScXXZB6cwiuCLPpCDNu5H7X0ZBfZBYoG75eZC6LJPLO3rzSupnNZBTwVBcZAPqta9VGxsxuCvQZDZD'; // Replace with your Facebook access token
      
      const response = await axios.get(apiUrl, {
>>>>>>> Stashed changes
        params: {
          fields: fields,
          access_token: accessToken
        }
      })
      return response.data
    } catch(error) {
      console.error('Error fetching data:', error);
    }
<<<<<<< Updated upstream
}
  
async function adsetEsists(adsetId){
    const query = `
    SELECT 1 FROM fb_ad WHERE adset_id = $1
    `;
    const result = await client.query(query, [adsetId]);
    return result.rowCount > 0;
}
async function populateAds(facebookAdData){
    if (!(await adsetEsists(facebookAdData.adset_id))) {
        console.log('Skipping insertion for ad with non-existent adset_id:', facebookAdData.adset_id);
        return; 
    }
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
        omni_business_id = EXCLUDED.omni_business_id
   
    `;
    const values = [
        facebookAdData.id, facebookAdData.adset_id, facebookAdData.campaign_id, "act_"+facebookAdData.account_id, 
        facebookAdData.name, facebookAdData.configured_status, facebookAdData.created_time, 
        facebookAdData.creative, facebookAdData.effective_status, facebookAdData.last_updated_by_app_id, 
        facebookAdData.preview_shareable_link, facebookAdData.source_ad,  `{${facebookAdData.source_ad_id}}`, 
        facebookAdData.status, JSON.stringify(facebookAdData.tracking_specs), facebookAdData.ad_active_time, "b_zfPwbkxKMDfeO1s9fn5TejRILh34hd"
    ];
    try {
        await client.query(query, values);
    } catch (error) {
        if (error.message.includes("violates foreign key constraint")) {
            console.log('Skipping insertion due to missing foreign key:', error.detail);
            return; // Skip further processing
        }
        console.error('Error inserting data:', error);
    }
}
async function main() {
    try {
        
        const facebookAdData = await getAdsets();
        for (let ad of facebookAdData.ads.data) {
            await populateAds(ad);
        }
    } catch (error) {
        console.error('Error during operation:', error);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

main()
=======
  }








  async function populateCampaigns(facebookCampaignData) {
    try {
      const query = `
        INSERT INTO fb_campaigns 
          (campaign_id, status, created_time, daily_budget, objective, start_time, stop_time, buying_type, budget_remaining, 
          bid_strategy, primary_attribution, source_campaign, special_ad_categories, updated_time, name, ad_account_id, omni_business_id, db_updated_at) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
          ad_account_id = EXCLUDED.ad_account_id,
          omni_business_id = EXCLUDED.omni_business_id,
          db_updated_at = EXCLUDED.db_updated_at;
        `;
      const values = [
        facebookCampaignData.campaign_id, facebookCampaignData.status, facebookCampaignData.created_time, facebookCampaignData.daily_budget, 
        facebookCampaignData.objective, facebookCampaignData.start_time, facebookCampaignData.stop_time, facebookCampaignData.buying_type, 
        facebookCampaignData.budget_remaining, facebookCampaignData.bid_strategy, facebookCampaignData.primary_attribution, facebookCampaignData.source_campaign, 
        facebookCampaignData.special_ad_categories, facebookCampaignData.updated_time, facebookCampaignData.name, facebookCampaignData.ad_account_id, 
        facebookCampaignData.omni_business_id, facebookCampaignData.db_updated_at
      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated campaign: ${facebookCampaignData.campaign_id} successfully`);
    } catch (err) {
      console.error('Insert or update error:', err.stack);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  





async function main () {
  const facebookCampaignData = await getCampaigns()

  //console.log(facebookCampaignData)

  for (let i = 0; i < facebookCampaignData.campaigns.data.length; i++) {
    const campaignData = {
      campaign_id: facebookCampaignData.campaigns.data[i].id,
      status: facebookCampaignData.campaigns.data[i].status,
      created_time: facebookCampaignData.campaigns.data[i].created_time,
      daily_budget: facebookCampaignData.campaigns.data[i].daily_budget / 100 || '',
      objective: facebookCampaignData.campaigns.data[i].objective,
      start_time: facebookCampaignData.campaigns.data[i].start_time,
      stop_time: facebookCampaignData.campaigns.data[i].stop_time,
      buying_type: facebookCampaignData.campaigns.data[i].buying_type,
      budget_remaining: facebookCampaignData.campaigns.data[i].budget_remaining / 100 || '',
      bid_strategy: facebookCampaignData.campaigns.data[i].bid_strategy || '',
      primary_attribution: facebookCampaignData.campaigns.data[i].primary_attribution,
      source_campaign: facebookCampaignData.campaigns.data[i].source_campaign || '',
      special_ad_categories: facebookCampaignData.campaigns.data[i].special_ad_categories,
      updated_time: facebookCampaignData.campaigns.data[i].updated_time,
      name: facebookCampaignData.campaigns.data[i].name, 
      ad_account_id: facebookCampaignData.id,
      omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd',
      db_updated_at: new Date(),
    }
    populateCampaigns(campaignData);
  
  }
}


main();


>>>>>>> Stashed changes
