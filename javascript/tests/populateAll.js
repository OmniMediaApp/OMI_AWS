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




async function populateSelectedAccount (postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken){

    
    
    await populateBusinessMain(postgres, omniBusinessId, fb_businessID , accessToken)
    console.log("Business populated successfully.");
    
    await populateAdAccountsMain(postgres, omniBusinessId, fb_adAccountID, accessToken)
    console.log("Ad Accounts populated successfully.");
      
}

async function populateDataDetails(postgres, omniBusinessId, fb_adAccountID, accessToken) {
  try {
    
    // await populateCampaignsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    //   console.log("Campaigns populated successfully.");

    //  await populateAdSetsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
    //   console.log("AdSets populated successfully.");

    await populateAdsMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
      console.log("Ads populated successfully.");

    await populateAdCreativesMain(postgres, omniBusinessId, fb_adAccountID, accessToken);
      console.log("Ad Creatives, populated successfully.");
    await populateAdVideos(postgres, omniBusinessId, fb_adAccountID, accessToken)
      console.log("Ad Videos populated successfully.");
  } catch (error) {
      console.error("An error occurred in populateDataDetails:", error);
  }
}
async function populateAll (postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken) {

try {
   await populateSelectedAccount(postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken);
   await populateDataDetails(postgres, omniBusinessId, fb_adAccountID, accessToken);  
  
  //fetchAdAccountUsage(fb_adAccountID, accessToken);
  //console.log("All data populated successfully.");
}catch (error) {
    console.error("An error occurred in populateAll:", error);
  }
}



module.exports = populateAll


