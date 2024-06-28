const express = require('express');
const { Client } = require('pg');
const { S3Client } = require('@aws-sdk/client-s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const getGoogleRefreshToken = require('./endpoints/getGoogleRefreshToken');
const getShopifyOrders = require('./endpoints/getShopifyOrders');
const getShopifyProductsFromShopify = require('./endpoints/getShopifyProductsFromShopify');
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
const getFileStructure = require('./endpoints/databaseQueries/getFileStructure');
const uploadFile = require('./endpoints/uploadFile');
const updateFileParent = require('./endpoints/databaseQueries/updateFileParent');
const updateFileName = require('./endpoints/databaseQueries/updateFileName');
const updateFileProductID = require('./endpoints/databaseQueries/updateFileProductID');
const populateShopifyProductsMain = require('./endpoints/populateShopifyProducts');
const downloadFileFromS3 = require('./endpoints/downloadFileFromS3');
const populateFacebookInsightsMain = require('./populateFacebookInsights/populateFacebookInsights');
const populateFacebookVideoInsightsMain = require('./populateFacebookInsights/populateFacebookVideoInsights');
const populateFacebookImageInsightsMain = require('./populateFacebookInsights/populateFacebookImageInsights');
const createShopifyWebhook = require('./endpoints/createShopifyWebhook');
const updateShopifyPorductsMain = require('./endpoints/updateShopifyProducts');
const generalSearch = require('./endpoints/databaseQueries/generalAdSearch');
const crypto = require('crypto');
const getShopifyStats = require('./endpoints/getShopifyStats');
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
  // Initialize AWS S3 storage bucket
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  const multer = require('multer');
const getShopifyProductsWithVariants = require('./endpoints/databaseQueries/getShopifyProductsWithVariants');
const getShopifyProducts = require('./endpoints/databaseQueries/getShopifyProducts');
const getFilesByProductID = require('./endpoints/databaseQueries/getFilesByProductID');
const getShopifyProductImages = require('./endpoints/databaseQueries/getShopifyProductImages');
  const aws_s3_storage = multer.memoryStorage(); // Store files in memory
  const upload = multer({ aws_s3_storage });
  



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

app.get('/getShopifyProductsFromShopify', async (req, res) => {
  try {
    const result = await getShopifyProductsFromShopify(db, req);
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

app.post('/createDraft', async (req, res) => {
  try{
  const result = await createDraft(postgres, db, req, res);
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

app.post('/uploadFile', upload.single('file'), async (req, res) => {


  try {
    const result = await uploadFile(postgres, s3, PutObjectCommand, req, res);
    res.status(200).send({ data: result });
  } catch (err) {
    console.log(err)
    res.status(500).send(err);
  }
});


// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  console.log("hello");

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
   

  if (mode && token) {
      if (mode === 'subscribe' && token === "OmniMedia") {
          console.log('WEBHOOK_VERIFIED');
          res.status(200).send(challenge);
      } else {
          res.sendStatus(403);
      }
  }
});

// Webhook event handling endpoint for shopify

// async function verifyShopifyWebhook(req, res, next) {
//   const shopDomain = req.get('X-Shopify-Shop-Domain');
//   const hmac = req.get('X-Shopify-Hmac-Sha256');
//   const body = JSON.stringify(req.body);
//   console.log("Hamc req ", hmac);

//   try {
//     // Query Firestore to get the user document based on shopDomain
//     const snapshot = await db.collection('businesses').where('shopifyDomain', '==', shopDomain).limit(1).get();
    
//     if (snapshot.empty) {
//       return res.status(401).send('Unauthorized: Unknown shop domain');
//     }

//     const userDoc = snapshot.docs[0];
//     const user = userDoc.data();
//     const secret = user.shopifyAdminAccessToken; // Assuming this is the shared secret
//     console.log(secret);

//     const hash = crypto
//       .createHmac('sha256', secret)
//       .update(body, 'utf8')
//       .digest('base64');

//     console.log(`Calculated HMAC: ${hash}`);
//     console.log(`Received HMAC: ${hmac}`);

//     if (hash === hmac) {
//       req.shopDomain = shopDomain; // Attach shop domain to request object
//       next();
//     } else {
//       res.status(401).send('Unauthorized: Invalid HMAC');
//     }
//   } catch (error) {
//     console.error('Error verifying webhook:', error);
//     res.status(500).send('Internal Server Error');
//   }
// }
// Webhook endpoint
app.post('/shopify/webhook', async (req, res) => {
  try {
  const webhookEvent = req.body;
  const productID = req.body.id;
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const snapshot = await db.collection('businesses').where('shopifyDomain', '==', shopDomain).limit(1).get();
  //console.log(`Received webhook from ${shopDomain}:`, webhookEvent);
  if (!snapshot.empty) {
    snapshot.forEach(doc => {
      omniBusinessId = doc.id;

    });
     await updateShopifyPorductsMain(db, postgres, omniBusinessId, productID);
  } else {
    console.log('No matching documents.');
  }
 
  

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while handling Shopify webhook.' });
  }
  

  // Handle the webhook event (e.g., save to database, trigger other actions)
  // ...

  res.status(200).send('Webhook received');
});
app.get('/createShopifyWebhook'), async (req, res) => {
  try {
    const omniBusinessId = req.omniBusinessId;
    const busRef = db.collection('businesses').doc(omniBusinessId);
    const busSnap = await busRef.get();
    const shopifyDomain = busSnap.data().shopifyDomain;
    const shopifyAccessToken = busSnap.data().shopifyAdminAccessToken;
    const webhookUrl = 'https://950a-2600-1009-a021-f16d-bd1e-45e8-571b-28eb.ngrok-free.app/shopify/webhook';
    const result = await createShopifyWebhook(shopifyDomain, shopifyAccessToken, webhookUrl);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while creating Shopify webhook.' });
  }
}

app.post('/getShopifyStats', async (req, res) => {
  try {
    const result = await getShopifyStats(db,postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching Shopify stats.' });
  }
}
);



app.get('/search', async (req, res) => {
  try {
    const result = await generalSearch(postgres, req, res);
    res.send(result);
  }
  catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' });
  }
}
);


app.get('/getFileStructure', async (req, res) => {
  try {
    const result = await getFileStructure(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});


app.get('/updateFileParent', async (req, res) => {
  try {
    const result = await updateFileParent(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating db' }); 
  }
});

app.get('/updateFileName', async (req, res) => {
  try {
    const result = await updateFileName(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating db' }); 
  }
});

app.get('/updateFileProductID', async (req, res) => {
  try {
    const result = await updateFileProductID(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating db' }); 
  }
});

app.get('/populateShopifyProducts', async (req, res) => {
  try {
    const result = await populateShopifyProductsMain(db, postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating db' }); 
  }
});


app.get('/getShopifyProducts', async (req, res) => {
  try {
    const result = await getShopifyProducts(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});


app.get('/getShopifyProductsWithVariants', async (req, res) => {
  try {
    const result = await getShopifyProductsWithVariants(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});


app.get('/getShopifyProductImages', async (req, res) => {
  try {
    const result = await getShopifyProductImages(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});


app.get('/downloadFileFromS3', async (req, res) => {
  try {
    const result = await downloadFileFromS3 (postgres, req, res);
    res.send(result)
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});

app.post('/populateFaceBook', async (req, res) => {
  try {
    const omniBusinessId = req.body.omniBusinessId;
    const activeOnly = req.body.activeOnly;
    const busRef = db.collection('businesses').doc(omniBusinessId);
    const busSnap = await busRef.get();
    const fb_access_token = busSnap.data().facebookAccessToken;
    const fb_adAccountIDs = busSnap.data().facebookAdAccountIDs;
    const fb_businessID = busSnap.data().facebookBusinessID;
    for (const fb_adAccountID of fb_adAccountIDs) {     
      await populateAll(postgres, omniBusinessId, fb_businessID, fb_adAccountID, fb_access_token, activeOnly);
    }
    res.send("success");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while populating all.' });
  }
});

app.post('/populateFacebookInsights', async (req, res) => {
  try {
    const omniBusinessId = req.body.omniBusinessId;

    const date_count = req.body.date_count;
    const busRef = db.collection('businesses').doc(omniBusinessId);
    const busSnap = await busRef.get();
    const fb_access_token = busSnap.data().facebookAccessToken; 
    const fb_adAccountIDs = busSnap.data().facebookAdAccountIDs;
    const fb_businessID = busSnap.data().facebookBusinessID;
    for (const fb_adAccountID of fb_adAccountIDs) {
      await populateFacebookInsightsMain(postgres, omniBusinessId, fb_businessID, fb_adAccountID, fb_access_token, date_count);
    }
    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating db' }); 
  }
});

app.post('/populateFacebookVideoInsights', async (req, res) => {
  try {
    const omniBusinessId = req.body.omniBusinessId;
    const date_count = req.body.date_count;
    const busRef = db.collection('businesses').doc(omniBusinessId);
    const busSnap = await busRef.get();
    const fb_access_token = busSnap.data().facebookAccessToken;
    const fb_adAccountIDs = busSnap.data().facebookAdAccountIDs;
    const fb_businessID = busSnap.data().facebookBusinessID;
    for (const fb_adAccountID of fb_adAccountIDs) {
      await populateFacebookVideoInsightsMain(postgres, omniBusinessId, fb_businessID, fb_adAccountID, fb_access_token, date_count);
    }
    res.send("success");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating db' }); 
  }
});
app.post('/populateFacebookImageInsights', async (req, res) => {
  try {
    const omniBusinessId = req.body.omniBusinessId;
    const date_count = req.body.date_count;
    const busRef = db.collection('businesses').doc(omniBusinessId);
    const busSnap = await busRef.get();
    const fb_access_token = busSnap.data().facebookAccessToken;
    const fb_adAccountIDs = busSnap.data().facebookAdAccountIDs;
    const fb_businessID = busSnap.data().facebookBusinessID;
    for (const fb_adAccountID of fb_adAccountIDs) {
      await populateFacebookImageInsightsMain(postgres, omniBusinessId, fb_businessID, fb_adAccountID, fb_access_token, date_count);
    }
    res.send("success");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating db' }); 
  }
});


app.get('/getFilesByProductID', async (req, res) => {
  try {
    const result = await getFilesByProductID(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});

app.post('/generateMoreTextOptions', async (req, res) => {
  try {
    const options = req.body.options;
    const type = req.body.type;
    const draftID = req.body.draftID;
    const result = await generateMoreTextOptions(db, options, type, draftID);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while generating more text options.' });
  }
});


app.get('/getPixelsByBID', async (req, res) => {
  try {
    const result = await getPixelsByBID(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});


app.get('/getPagesByBID', async (req, res) => {
  try {
    const result = await getPagesByBID(postgres, req, res);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});


app.get('/getPixelInsights', async (req, res) => {
  try {
    const omniBusinessID = req.query.omniBusinessID;
    const businessRef = db.collection('businesses').doc(omniBusinessID);
    const doc = await businessRef.get();
    const facebookBusinessID = doc.data().facebookBusinessID;
    const facebookAccessToken = doc.data().facebookAccessToken;
    console.log(`https://graph.facebook.com/v19.0/${facebookBusinessID}?fields=adspixels{name,id,stats{start_time,data}}&access_token=${facebookAccessToken}`)
    const result = await axios.get(`https://graph.facebook.com/v19.0/${facebookBusinessID}?fields=adspixels{name,id,stats{start_time,data}}&access_token=${facebookAccessToken}`)
    res.send(result.data);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while querying db' }); 
  }
});













// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
