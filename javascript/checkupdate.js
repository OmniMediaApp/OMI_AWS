const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { Client } = require('pg');
const serviceAccount = require('./ServiceAccountKey.json')
const { DateTime } = require('luxon');
const { all } = require('axios');
require('dotenv').config();
const populateAll = require('./tests/populateAll');
// Initialize Firebase Admin SDK only once
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'omni-media-197a0.appspot.com',
  });
}

// PostgreSQL connection options
const dbOptions = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};



// Create a new PostgreSQL client
const postgres = new Client(dbOptions);

// Connect to the PostgreSQL database
postgres.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Connection error', err.stack));

const db = admin.firestore();

// Function to check and update main
async function checkUpdateMain(fb_adAccountID, accessToken) {
  try {
    const result = await postgres.query('SELECT db_updated_at FROM fb_ad_account WHERE account_id = $1', [fb_adAccountID]);
    if (result.rows.length === 0) {
      console.error('No db_updated_at found for account_id:', fb_adAccountID);
      return;
    }
    
    const dbUpdatedAt = result.rows[0].db_updated_at;
    const dbUpdatedAtUnix = DateTime.fromISO(dbUpdatedAt).toSeconds();

    const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/ads`;
    const fields = 'ad_id,name,updated_time';
    let allData = [];
    let params = {
      access_token: accessToken,
      fields: fields,
      filtering: `[{"field":"updated_time","operator":"GREATER_THAN","value":"${dbUpdatedAtUnix}"}]`
    };

    const response = await fetch(`${apiUrl}?access_token=${params.access_token}&fields=${params.fields}&filtering=${encodeURIComponent(params.filtering)}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      allData = data.data.map(ad => ad.id);
    }
    console.log('New ads:', allData.length);
    return allData;
  } catch (error) {
    console.error('Error in checkUpdateMain:', error);
  }
}

// Main function to iterate through all businesses and call checkUpdateMain
async function fetchAndUpdateAds() {
  try {
    const allBusinesses = db.collection('businesses');
    const businessesSnapshot = await allBusinesses.get();

    businessesSnapshot.forEach(async (doc) => {
      const businessData = doc.data();
      const facebookAdAccountIDs = businessData.facebookAdAccountIDs;
      const facebookAccessToken = businessData.facebookAccessToken;
      const facebookBusinessID = businessData.facebookBusinessID;

      if (Array.isArray(facebookAdAccountIDs) && facebookAdAccountIDs.length > 0 && facebookBusinessID) {
        const facebookAdAccountID = facebookAdAccountIDs[0];

        console.log('Business:', {
          id: doc.id,
          facebookAdAccountID,
          facebookAccessToken
        });

        // Call checkUpdateMain for each business document
        const ids = await checkUpdateMain(facebookAdAccountID, facebookAccessToken);
        console.log("account_id", facebookAdAccountID,'ids:', ids);
        if (ids && ids.length > 0) {
          await populateAll(postgres, doc.id, facebookBusinessID, facebookAdAccountID, facebookAccessToken, true);
        }
      } else {
        console.error(`No valid facebookAdAccountIDs for business with id ${doc.id}`);
      }
    });
  } catch (error) {
    console.error('Error in fetchAndUpdateAds:', error);
  }
}

// Schedule the function to run every 5 minutes
setInterval(fetchAndUpdateAds, 5 * 60 * 1000); // 5 minutes in milliseconds

// Run the function immediately on start
fetchAndUpdateAds().catch(console.error);
