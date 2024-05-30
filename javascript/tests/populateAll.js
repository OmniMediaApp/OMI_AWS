require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');
 const populateCampaignsMain = require('./populateCampaigns');
const populateAdAccountsMain = require('./populateAdAccounts');
const populateBusinessMain = require('./populateBusinesses');
const populateAdSetsMain = require('./populateAdSets');
const populateAdsMain = require('./populateAds');
const populateAdCreativesMain = require('./populateAdCreatives');
const populateAdVideos = require('./populateAdVideos');
const populatePagesMain = require('./populatePages');



async function populateSelectedAccount (postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken){
    try {
    await populateBusinessMain(postgres, omniBusinessId, fb_businessID , accessToken)
    console.log("PopulateAll.js: Business populated successfully.");
    
    await populateAdAccountsMain(postgres, omniBusinessId, fb_adAccountID, accessToken)
    console.log("PopulateAll.js: Ad Accounts populated successfully.");
    
    await populatePagesMain(postgres, omniBusinessId, fb_businessID, accessToken)
    console.log("PopulateAll.js: Pages populated successfully.");
    } catch (error) {
      console.error("PopulateAll.js: An error occurred in populateSelectedAccount:", error);

    }
  }




async function populateDataDetails(postgres, omniBusinessId, fb_adAccountID, accessToken) {
  try {
    
    await populateCampaignsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("PopulateAll.js: Campaigns populated successfully.");

    await populateAdSetsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("PopulateAll.js: AdSets populated successfully.");

    await populateAdsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("PopulateAll.js: Ads populated successfully.");

    await populateAdCreativesMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    console.log("PopulateAll.js: Ad Creatives, populated successfully.");

    await populateAdVideos(postgres, omniBusinessId, fb_adAccountID, accessToken)
    console.log("PopulateAll.js: Ad Videos populated successfully.");

  } catch (error) {
      console.error("PopulateAll.js: An error occurred in populateDataDetails:", error);
  }
}



async function populateAll (postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken) {

  try {
    await populateSelectedAccount(postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken);
    // await populateDataDetails(postgres, omniBusinessId, fb_adAccountID, accessToken);  
    
    return "success"

  } catch (error) {
    console.error("PopulateAll.js: An error occurred in populateAll:", error);

    return "error"
  }
}



module.exports = populateAll
