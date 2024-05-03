require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');
 const populateCampaignsMain = require('./populateCampaigns');
const populateAdAccountsMain = require('./populateAdAccounts');
const populateBusinessMain = require('./populateBusinesses');
const populateAdSetsMain = require('./populateAdSets');
const populateAdsMain = require('./populateAds');
const populateAdCreativesMain = require('./populateAdCreatives');
// AWS RDS POSTGRESQL INSTANCE
// const dbOptions = {
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// };

// // Create a new PostgreSQL client
// const postgres = new Client(dbOptions);

// // Connect to the PostgreSQL database
// postgres.connect()
//   .then(() => console.log('Connected to the database'))
//   .catch(err => console.error('Connection error', err.stack));





async function populateSelectedAccount (postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken){

    
    
    await populateBusinessMain(postgres, omniBusinessId, fb_businessID , accessToken)
    console.log("Business populated successfully.");
    
    await populateAdAccountsMain(postgres, omniBusinessId, fb_adAccountID, accessToken)
    console.log("Ad Accounts populated successfully.");
      
}

async function populateDataDetails(postgres, omniBusinessId, fb_adAccountID, accessToken) {
  try {
    
    await populateCampaignsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("Campaigns populated successfully.");

    await populateAdSetsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("AdSets populated successfully.");

    await populateAdsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("Ads populated successfully.");

    await populateAdCreativesMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("Ad Creatives, and Ad media populated successfully.");

  } catch (error) {
    console.error("An error occurred in populateDataDetails:", error);
  }
}
async function populateAll (postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken) {


  await populateSelectedAccount(postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken);
  await populateDataDetails(postgres, omniBusinessId, fb_adAccountID, accessToken);  
  console.log("All data populated successfully.");

}


module.exports = populateAll


