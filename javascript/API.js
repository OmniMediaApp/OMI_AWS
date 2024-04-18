const express = require('express');
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
const handleMediaUpload = require('./endpoints/uploadMedia'); // Adjust './uploadMedia' as necessary based on your directory structure
const getGoogleStats = require('./endpoints/getGoogleStatas');
//const saveHistoricalShopifyStats = require('./endpoints/saveHistoricalShopifyStats');

const app = express();

const PORT = 3001;

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'omni-media-197a0.appspot.com',
});

const db = admin.firestore();
const storage = admin.storage();

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
    const result = await saveShopifyProductCOGS(db, req);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while saving Shopify product COGS.' });
  }
});

app.get('/getShopifyOverview', async (req, res) => {
  try {
    const result = await getShopifyOverview(db, req);
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

app.get('/getGoogleRefreshToken', async (req, res) => {
  try {
    const userID = req.body.userID;
    const result = await getGoogleRefreshToken(db, userID);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching Google refresh token.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
