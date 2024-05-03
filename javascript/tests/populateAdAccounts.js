require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');

// Log the environment variables for database connection
// console.log("Environment Variables:", {
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// const dbOptions = {
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// };

// const client = new Client(dbOptions);

// async function connectToDatabase() {
//   try {
//     await client.connect();
//     console.log('Connected to the database');
//   } catch (err) {
//     console.error('Database connection error', err.stack);
//     process.exit(1);
//   }
// }

async function getAdAccounts(fb_adAccountID, accessToken) {
  try {
    const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}`;
    const fields = `name,business,account_status,business_name,created_time,existing_customers,funding_source,funding_source_details,id,is_personal,is_prepay_account,line_numbers,owner,spend_cap,timezone_id,timezone_name,timezone_offset_hours_utc`;
 

    const response = await axios.get(apiUrl, {
      params: {
        fields: fields,
        access_token: accessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function populateAdAccounts(postgres, facebookAdAccountData) {
  const query = `
    INSERT INTO fb_ad_account
      (account_id, name, account_status, business_name, created_time, funding_source, funding_source_details, is_personal, 
        is_prepay_account, owner, spend_cap, timezone_id, timezone_name, timezone_offset_hours_utc, omni_business_id) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (account_id) DO UPDATE SET
      name = EXCLUDED.name,
      account_status = EXCLUDED.account_status,
      business_name = EXCLUDED.business_name,
      created_time = EXCLUDED.created_time,
      funding_source = EXCLUDED.funding_source,
      funding_source_details = EXCLUDED.funding_source_details,
      is_personal = EXCLUDED.is_personal,
      is_prepay_account = EXCLUDED.is_prepay_account,
      owner = EXCLUDED.owner,
      spend_cap = EXCLUDED.spend_cap,
      timezone_id = EXCLUDED.timezone_id,
      timezone_name = EXCLUDED.timezone_name,
      timezone_offset_hours_utc = EXCLUDED.timezone_offset_hours_utc,
      omni_business_id = EXCLUDED.omni_business_id;
  `;
  const values = [
    facebookAdAccountData.account_id, facebookAdAccountData.name, facebookAdAccountData.account_status, facebookAdAccountData.business_name, facebookAdAccountData.created_time,
    facebookAdAccountData.funding_source, facebookAdAccountData.funding_source_details, facebookAdAccountData.is_personal, facebookAdAccountData.is_prepay_account,
    facebookAdAccountData.owner, facebookAdAccountData.spend_cap, facebookAdAccountData.timezone_id, facebookAdAccountData.timezone_name,
    facebookAdAccountData.timezone_offset_hours_utc, facebookAdAccountData.omni_business_id
  ];

  try {
    await postgres.query(query, values);
    console.log(`Inserted or updated ad account: ${facebookAdAccountData.account_id} successfully`);
  } catch (err) {
    console.error('Insert or update error:', err.stack);
    process.exit(1);
  }
}

async function populateAdAccountsMain(postgres, omniBusinessId, fb_adAccountID, accessToken) {
  

  try {
    const facebookAdAccountData = await getAdAccounts(fb_adAccountID, accessToken);
    // console.log({facebookAdAccountData})
    if (!facebookAdAccountData) {
      throw new Error('Invalid ad account data fetched.');
      
    }

      
      const adAccountData = {
        account_id: facebookAdAccountData.id,
        name: facebookAdAccountData.name,
        account_status: facebookAdAccountData.account_status,
        business_name: facebookAdAccountData.business_name,
        created_time: facebookAdAccountData.created_time,
        funding_source: facebookAdAccountData.funding_source,
        funding_source_details: facebookAdAccountData.funding_source_details,
        is_personal: facebookAdAccountData.is_personal,
        is_prepay_account: facebookAdAccountData.is_prepay_account,
        owner: facebookAdAccountData.owner,
        spend_cap: facebookAdAccountData.spend_cap,
        timezone_id: facebookAdAccountData.timezone_id,
        timezone_name: facebookAdAccountData.timezone_name,
        timezone_offset_hours_utc: facebookAdAccountData.timezone_offset_hours_utc,
        fb_business_id: facebookAdAccountData.business.id,
        omni_business_id:omniBusinessId,
      };
      await populateAdAccounts(postgres, adAccountData);
    }
   catch (error) {
    console.error('An error occurred in the main flow', error);
  } finally {
    // await client.end();
  }

}
module.exports = populateAdAccountsMain
