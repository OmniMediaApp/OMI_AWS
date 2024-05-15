const express = require('express');
const { Client } = require('pg');
const getGoogleRefreshToken = require('./endpoints/getGoogleRefreshToken');
const getShopifyOrders = require('./endpoints/getShopifyOrders');
const getShopifyProducts = require('./endpoints/getShopifyProducts');
const getShopifyOverview = require('./endpoints/getShopifyOverview');
const saveShopifyStats = require('./endpoints/saveShopifyStats');
const saveHistoricalShopifyStats = require('./endpoints/SaveHistoricalStats');
const saveShopifyProductCOGS = require('./endpoints/saveShopifyProductCOGS');
const createDraft = require('./endpoints/createDraft/createDraft');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./ServiceAccountKey.json')
const handleAdAccountChange = require('./endpoints/handleFacebookWebhook'); // Adjust './uploadMedia' as necessary based on your directory structure
const insertFbWebhookData = require('./endpoints/handleFacebookWebhook');
const getGoogleStats = require('./endpoints/getGoogleStats');
const populateAll = require('./tests/populateAll');
const getFacebookAccessToken = require('./endpoints/getFacebookRefreshToken');
const getAds = require('./endpoints/databaseQueries/getAds');
const getAdAccountsByBID = require('./endpoints/databaseQueries/getAdAccountsByBID');
//const saveHistoricalShopifyStats = require('./endpoints/saveHistoricalShopifyStats');
require('dotenv').config();

const app = express();

const PORT = 3000;

//CHNAGES MADE

//MORE CHANGES
// db for firbase connection
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'omni-media-197a0.appspot.com',
});

const db = admin.firestore();
const storage = admin.storage();

// db for postgres connection
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

  // async function connectToDatabase() {
  //     try {
  //         await postgres.connect();
  //         console.log('Connected to the database');
  //     } catch (err) {
  //         console.error('Database connection error', err.stack);
  //         process.exit(1);
  //     }
  // }
  const omniBusinessId = 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd';
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const fb_businessID = '499682821437696';
  const fb_adAccountID = 'act_331027669725413';


function saveShopifyStatsAtMidnight() {
  console.log('Running at midnight!');
  saveShopifyStats(db)
}

function checkMidnight() {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
    saveShopifyStatsAtMidnight();
  }
}
setInterval(checkMidnight, 1000);

app.get('/saveShopifyStats', async (req, res) => {
  try {
    const result = await saveShopifyStats(db);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while saving Shopify stats.' });
  }
});
app.get('/saveHistoricalStats', async (req, res) => {
  try {
    const result = await saveHistoricalShopifyStats(db);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while saving Historical Shopify stats.' });
  }
});

app.get('/getGoogleStats',async (req, res) =>{
  
  try {
    const result = await getGoogleStats(db);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while getting Google Stats.' });
  }
});

app.get('/getShopifyOrders', async (req, res) => {
  try {
    const result = await getShopifyOrders(db, req);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching Shopify orders.' });
  }
});

app.get('/getShopifyProducts', async (req, res) => {
  try {
    const result = await getShopifyProducts(db, req);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching Shopify products.' });
  }
});

app.get('/saveShopifyProductCOGS', async (req, res) => {
  try {
    const result = await saveShopifyProductCOGS(db, req, postgres);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while saving Shopify product COGS.' });
  }
});

app.get('/getShopifyOverview', async (req, res) => {
  try {
    const result = await getShopifyOverview(db, req, res, postgres);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching Shopify overview.' });
  }
});

app.get('/createDraft', async (req, res) => {
  try{
  const result = await createDraft(db, req, res);
  res.send(result);
  } catch (error){
    console.error(error);
    res.status(500).send({error: 'An error occurred while creating draft.'})
  }

}); 
854522159611705

app.get('/createFacebookAd', async (req, res) => {
  try{
  const result=(await createFacebookAd(db, req, res));
  res.send(result);
  } catch (error){
    console.error(error);
    res.status(500).send({error: 'An error occured while creating facebook ad'})
  }
});

//app.post('/uploadMedia', handleMediaUpload);

app.get('/DBtest', async (req, res) => {
  const userRef = db.collection('users').doc("TBU8GTLnTtQA03dOjp33c9wrDjT2");
  const userSnap = (await userRef.get()).data();
  console.log(userSnap)
  res.send({ date: 'success' });
});

app.post('/getGoogleRefreshToken', async (req, res) => {
  try {
    const userID = req.body.userID;
    const result = await getGoogleRefreshToken(db, userID);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching Google refresh token.' });
  }
});

app.post('/getFacebookRefreshToken', async (req, res) => {
  try {
    const userID = req.body.userID;
    const result = await getFacebookAccessToken(db, userID);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching Facebook access token.' });
  }
});

app.post('/populateFaceBook', async (req, res) => {
  try {
    const omniBusinessId = req.body.omniBusinessId;
    const fb_businessID = req.body.fb_businessID;
    const fb_adAccountID = req.body.fb_adAccountID;
    const accessToken = req.body.accessToken;
    
    const result = await populateAll(postgres, omniBusinessId, fb_businessID, fb_adAccountID, accessToken);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while populating all.' });
  }
});

app.get('/getAds', async (req, res) => {
  try {
    console.log(req)
    const result = await getAds(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});

app.get('/getAdAccountsByBID', async (req, res) => {
  try {
    const result = await getAdAccountsByBID(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});
// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  console.log("hello");

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
   

  if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          console.log('WEBHOOK_VERIFIED');
          res.status(200).send(challenge);
      } else {
          res.sendStatus(403);
      }
  }
});

// Webhook event handling endpoint
app.post('/webhook', (req, res) => {
  const data = req.body;
  console.log("hello");

  console.log(JSON.stringify(data, null, 2));
  insertFbWebhookData(JSON.stringify(data));
  // if (data.object === 'ad_account') {
  //     data.entry.forEach((entry) => {
  //         const adAccountId = entry.id;
  //         entry.changes.forEach((change) => {
  //             handleAdAccountChange(adAccountId, change);
  //         });
  //     });
  // }

  res.status(200).send('EVENT_RECEIVED');
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
