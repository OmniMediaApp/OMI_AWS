require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');




// AWS RDS POSTGRESQL INSTANCE
const dbOptions = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// Create a new PostgreSQL client
const client = new Client(dbOptions);

// Connect to the PostgreSQL database
// client.connect()
//   .then(() => console.log('Connected to the database'))
//   .catch(err => console.error('Connection error', err.stack));




  async function connectToDatabase() {
    try {
      await client.connect();
      console.log('Connected to the database');
    } catch (err) {
      console.error('Database connection error', err.stack);
      process.exit(1); // Exit the process with an error code
    }
  }
  


  async function getCampaigns () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
      const fields = 'created_time,id,is_personal,campaigns.limit(100){name,adlabels,created_time,daily_budget,id,lifetime_budget,objective,promoted_object,spend_cap,start_time,status,stop_time,buying_type,budget_remaining,account_id,bid_strategy,primary_attribution,source_campaign,special_ad_categories,updated_time}';
      const accessToken = process.env.FB_ACCESS_TOKEN; // Replace with your Facebook access token
      
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




  async function populateCampaigns(facebookCampaignData, postgres) {
    
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
        facebookCampaignData.special_ad_categories, facebookCampaignData.updated_time, facebookCampaignData.name, facebookCampaignData.ad_account_id, 
        facebookCampaignData.omni_business_id, facebookCampaignData.db_updated_at
      ];

      try {
      const result = await client.query(query, values);
      console.log(`Inserted or updated campaign: ${facebookCampaignData.campaign_id} successfully`);
    } catch (err) {
      console.error('Insert or update error:', err.stack);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  




async function main (postgres) {
  await connectToDatabase();
try{
  const facebookCampaignData = await getCampaigns();

  if (!facebookCampaignData || !facebookCampaignData.campaigns) {
     throw new Error('Invalid ad account data fetched.');
  }

  for (const campaign of facebookCampaignData.campaigns.data) {
    const campaignData = {
      campaign_id: campaign.id,
      status: campaign.status,
      created_time: campaign.created_time,
      daily_budget: campaign.daily_budget / 100 || '',
      objective: campaign.objective,
      start_time: campaign.start_time,
      stop_time: campaign.stop_time,
      buying_type: campaign.buying_type,
      budget_remaining: campaign.budget_remaining / 100 || '',
      bid_strategy: campaign.bid_strategy || '',
      primary_attribution: campaign.primary_attribution,
      source_campaign: campaign.source_campaign || '',
      special_ad_categories: campaign.special_ad_categories,
      updated_time: campaign.updated_time,
      name: campaign.name, 
      ad_account_id: facebookCampaignData.id, // Assuming this is the correct association
      omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd',
      db_updated_at: new Date(),
    }

    // If order matters or you want to handle errors per campaign, await here
    await populateCampaigns(campaignData).catch((error) => {
      console.error(`Error populating campaign ${campaignData.campaign_id}: `, error);
    });
  }
} catch (error) {
  console.error('An error occurred in the main flow', error);
} finally {
  await client.end(); // Close the client connection at the end of all operations
}
  // Consider adding client.end() here to close the connection after all operations are done
}

main();


