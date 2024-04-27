const { Client } = require('pg');
const axios = require('axios');




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




  


  async function getAdAccounts () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/499682821437696';
      const fields = 'owned_ad_accounts{name,campaigns,account_status,business_name,created_time,existing_customers,funding_source,funding_source_details,id,is_personal,is_prepay_account,line_numbers,owner,spend_cap,timezone_id,timezone_name,timezone_offset_hours_utc}';
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








  async function populateAdAccounts(facebookAdAccountData) {
    try {
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
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated ad account: ${facebookAdAccountData.id} successfully`);
    } catch (err) {
      console.error('Insert or update error:', err.stack);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  





async function main () {
  const facebookAdAccountData = await getAdAccounts()

  //console.log(facebookAdAccountData)

  for (let i = 0; i < facebookAdAccountData.owned_ad_accounts.data.length; i++) {
    const campaignData = {
        account_id: facebookAdAccountData.owned_ad_accounts.data[i].id,
        name: facebookAdAccountData.owned_ad_accounts.data[i].name,
        account_status: facebookAdAccountData.owned_ad_accounts.data[i].account_status,
        business_name: facebookAdAccountData.owned_ad_accounts.data[i].business_name,
        created_time: facebookAdAccountData.owned_ad_accounts.data[i].created_time,
        funding_source: facebookAdAccountData.owned_ad_accounts.data[i].funding_source,
        funding_source_details: facebookAdAccountData.owned_ad_accounts.data[i].funding_source_details,
        is_personal: facebookAdAccountData.owned_ad_accounts.data[i].is_personal,
        is_prepay_account: facebookAdAccountData.owned_ad_accounts.data[i].is_prepay_account,
        owner: facebookAdAccountData.owned_ad_accounts.data[i].owner,
        spend_cap: facebookAdAccountData.owned_ad_accounts.data[i].spend_cap,
        timezone_id: facebookAdAccountData.owned_ad_accounts.data[i].timezone_id,
        timezone_name: facebookAdAccountData.owned_ad_accounts.data[i].timezone_name,
        timezone_offset_hours_utc: facebookAdAccountData.owned_ad_accounts.data[i].timezone_offset_hours_utc,
        omni_business_id: "b_zfPwbkxKMDfeO1s9fn5TejRILh34hd",

    }
    populateAdAccounts(campaignData);
  
  }
}


main();


