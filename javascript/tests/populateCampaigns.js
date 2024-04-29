const { Client } = require('pg');
const axios = require('axios');




// // AWS RDS POSTGRESQL INSTANCE
// const dbOptions = {
//   user: 'postgres',
//   host: 'omnirds.cluster-chcpmc0xmfre.us-east-2.rds.amazonaws.com',
//   database: 'postgres',
//   password: 'Omni2023!',
//   port: '5432',
// };

// // Create a new PostgreSQL client
// const postgres = new Client(dbOptions);

// // Connect to the PostgreSQL database
// postgres.connect()
//   .then(() => console.log('Connected to the database'))
//   .catch(err => console.error('Connection error', err.stack));






  


  async function getCampaigns () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
      const fields = 'created_time,id,is_personal,campaigns{name,adlabels,created_time,daily_budget,id,lifetime_budget,objective,promoted_object,spend_cap,start_time,status,stop_time,buying_type,budget_remaining,account_id,bid_strategy,primary_attribution,source_campaign,special_ad_categories,updated_time}';
      const accessToken = 'EAAMJLvHGvzkBO2DmjIBVZA65h71ksz2JCQWaPlVmF6vyZCZBmDwhj2c2UHh6CS0tX1vljztwyHaExxtQOjzEoRJwNaG2OeNk1ZBMZBQ23V38XhXZCVsdKqucwnhT3KAQ9cKPU24mpaDMWc7ZAIdKLOvt1iZBsrraGZABn34gf2yDZAC3TvpQSZBMDQZBVn0XYBhk9WfEnnnR09ojte6pGGewVeCm0yVjZCZB6ta8OlUZCTZCKs6H3QZDZD'; // Replace with your Facebook access token
      
      const response = await axios.get(apiUrl, {
        params: {
          fields: fields,
          access_token: accessToken
        }
      })
      return response.data
    } catch(error) {
      console.error('Error fetching data:', error);
    }
  }








  async function populateCampaigns(postgres, facebookCampaignData) {
    try {
      const query = `
        INSERT INTO fb_campaign 
          (campaign_id, status, created_time, daily_budget, objective, start_time, stop_time, buying_type, budget_remaining, 
          bid_strategy, primary_attribution, source_campaign, special_ad_categories, updated_time, name, account_id, omni_business_id, db_updated_at) 
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
          account_id = EXCLUDED.account_id,
          omni_business_id = EXCLUDED.omni_business_id,
          db_updated_at = EXCLUDED.db_updated_at;
        `;
      const values = [
        facebookCampaignData.campaign_id, facebookCampaignData.status, facebookCampaignData.created_time, facebookCampaignData.daily_budget, 
        facebookCampaignData.objective, facebookCampaignData.start_time, facebookCampaignData.stop_time, facebookCampaignData.buying_type, 
        facebookCampaignData.budget_remaining, facebookCampaignData.bid_strategy, facebookCampaignData.primary_attribution, facebookCampaignData.source_campaign, 
        facebookCampaignData.special_ad_categories, facebookCampaignData.updated_time, facebookCampaignData.name, facebookCampaignData.account_id, 
        facebookCampaignData.omni_business_id, facebookCampaignData.db_updated_at
      ];
  
      const result = await postgres.query(query, values);
      console.log(`Inserted or updated campaign: ${facebookCampaignData.campaign_id} successfully`);
    } catch (err) {
      console.error('Insert or update error:', err.stack);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  





async function populateCampaignsMain (postgres, omniBusinessId  ) {
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
      account_id: facebookCampaignData.id,
      omni_business_id: omniBusinessId,
      db_updated_at: new Date(),
    }
    populateCampaigns(postgres, campaignData);
  
  }
}


//populateCampaignsMain();
module.exports = populateCampaignsMain;


