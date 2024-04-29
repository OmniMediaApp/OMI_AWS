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






  


  async function getBusinesses () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/me?';
      const fields = 'businesses{verification_status,created_by,created_time,id,name,adspixels{id,last_fired_time,name,owner_ad_account,owner_business}}';
      const accessToken = 'EAAMJLvHGvzkBO0XpnQtRd6AfQp5CozScRgQTlejfKwU4LeuoII97YmoxDDJn0OM4Vs7u1t3YXwAT4yKX2XUMXumPWWZANAhOTirLXxIY3AC6wpGnMT6343BXK6ZB4yk08tZCJt6gB8IHtn4OkMuLL834xDr1ZBQo5ZBb9QMDa9Ci9eQXwrKdJn8SM80t8qZBW1yIIEVNut0BivKdhCiAxhwjUkzVGWbCmFNwsAkuMbZCgZDZD'; // Replace with your Facebook access token
      
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








  async function populateBusinesses(postgres, facebookBusinessData) {
    try {
      const query = `
        INSERT INTO fb_business
          (business_id, ad_accounts, business_name, verification_status, created_time, omni_business_id, db_updated_at) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (business_id) DO UPDATE SET 
            ad_accounts = EXCLUDED.ad_accounts,
            business_name = EXCLUDED.business_name,
            verification_status = EXCLUDED.verification_status,
            created_time = EXCLUDED.created_time,
            omni_business_id = EXCLUDED.omni_business_id,
            db_updated_at = EXCLUDED.db_updated_at,
          
        `;
      const values = [
        facebookBusinessData.business_id, facebookBusinessData.ad_accounts, facebookBusinessData.business_name, facebookBusinessData.verification_status, 
        facebookBusinessData.created_time, facebookBusinessData.omni_business_id, facebookBusinessData.db_updated_at
      ];
  
      const result = await postgres.query(query, values);
      console.log(`Inserted or updated Business: ${facebookBusinessData.business_id} successfully`);
    } catch (err) {
      console.error('Insert or update error:', err.stack);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  





async function populateBusinessesMain (postgres, omniBusinessId  ) {
  const facebookBusinessData = await getBusinesses()

  //console.log(facebookBusinessData)

  for (let i = 0; i < facebookBusinessData.campaigns.data.length; i++) {
    const campaignData = {
      campaign_id: facebookBusinessData.campaigns.data[i].id,
      status: facebookBusinessData.campaigns.data[i].status,
      created_time: facebookBusinessData.campaigns.data[i].created_time,
      daily_budget: facebookBusinessData.campaigns.data[i].daily_budget / 100 || '',
      objective: facebookBusinessData.campaigns.data[i].objective,
      start_time: facebookBusinessData.campaigns.data[i].start_time,
      stop_time: facebookBusinessData.campaigns.data[i].stop_time,
      buying_type: facebookBusinessData.campaigns.data[i].buying_type,
      budget_remaining: facebookBusinessData.campaigns.data[i].budget_remaining / 100 || '',
      bid_strategy: facebookBusinessData.campaigns.data[i].bid_strategy || '',
      primary_attribution: facebookBusinessData.campaigns.data[i].primary_attribution,
      source_campaign: facebookBusinessData.campaigns.data[i].source_campaign || '',
      special_ad_categories: facebookBusinessData.campaigns.data[i].special_ad_categories,
      updated_time: facebookBusinessData.campaigns.data[i].updated_time,
      name: facebookBusinessData.campaigns.data[i].name, 
      account_id: facebookBusinessData.id,
      omni_business_id: omniBusinessId,
      db_updated_at: new Date(),
    }
    populateCampaigns(postgres, campaignData);
  
  }
}


//populateCampaignsMain();
module.exports = populateCampaignsMain;


