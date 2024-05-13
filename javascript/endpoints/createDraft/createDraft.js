//const puppeteer = require('puppeteer'); //!!!!!! npm install puppeteer@16.2.0
const getBusinessData = require('./component/getBusinessData');
const generateContent = require('./component/generateContent')
const scrapeWebpage = require('./component/scrapeWebpage')
const checkInterestsWithFacebook = require('./component/facebookInterests')
const facebookLocationSuggestions = require('./component/facebookLocations')
const saveDraft = require('./component/saveDraft')

async function createDraft(db, req, res) {

  try {
    //FROM REQUEST
    const scrape = req.query.scrape;
    const product = JSON.parse(req.query.product) || '';
    const productUrl = req.query.productUrl;
    const uid = req.query.uid;

    //FROM FIRESTORE
    const businessData = await getBusinessData(db, uid);
    const businessID = businessData.businessID;
    console.log(businessData)
    const lastUsedFacebookAdAccount = businessData.lastUsedFacebookAdAccount;
    const lastUsedFacebookPixel = businessData.lastUsedFacebookPixel;
    const lastUsedFacebookPage = businessData.lastUsedFacebookPage;
    const facebookAccessToken = businessData.facebookAccessToken;

    //GETTING THE PRODUCT INFO
    let productInfo = '';
    if (scrape == 'true') {
      productInfo = await scrapeWebpage(productUrl);
    } else {
      let imageInfoArray = [];
      for (let i = 0; i < product.node.images.nodes.length; i++) {
        imageInfoArray.push({src: product?.node?.images?.nodes[i]?.src})
      }
      productInfo = {
        imageInfoArray: imageInfoArray.slice(0, 5),
        product_name: product.node.title,
        product_description: product.node.description
      }
      //console.log(productInfo)
    }
    if (!productInfo) {
      res.status(500).json({ error: 'Failed to scrape product information.' });
      return;    
    }


    //GETTING AND PARSING THE AI RESPONSE
    const aiResponse = await generateContent(productInfo.product_name, productInfo.product_description);
    const aiResponseLines = aiResponse.split('\n');
    const optimizedProductName = aiResponseLines[0].substring(3).trim();
    const fb_PrimaryText = aiResponseLines[1].substring(3).trim();
    const fb_HeadlineText = aiResponseLines[2].substring(3).trim();
    const fb_DescriptionText = aiResponseLines[3].substring(3).trim();
    const fb_Location = aiResponseLines[4].substring(3).trim();
    const fb_Age = aiResponseLines[5].substring(3).trim();
    const fb_Gender = aiResponseLines[6].substring(3).trim();
    const fb_Interests = aiResponseLines[7].substring(3).trim();
    const fb_CTA = aiResponseLines[8].substring(3).trim();


    //GETTING ALL POSSIBLE LOCATIONS AND INTERESTS FROM FACEBOOK
    const fb_VerifiedInterests = await checkInterestsWithFacebook(fb_Interests, facebookAccessToken)
    const fb_LocationSuggestions = await facebookLocationSuggestions(fb_Location, facebookAccessToken)


    //SAVING THE DRAFT TO FIRESTORE
    const draftID = await saveDraft(
      db, 
      optimizedProductName, 
      businessID, 
      fb_PrimaryText, 
      fb_HeadlineText, 
      fb_DescriptionText, 
      fb_LocationSuggestions, 
      fb_Age, 
      fb_Gender, 
      fb_VerifiedInterests, 
      fb_CTA, 
      productInfo.imageInfoArray, 
      uid, 
      productUrl, 
      lastUsedFacebookAdAccount, 
      lastUsedFacebookPixel, 
      lastUsedFacebookPage, 
      facebookAccessToken
    ) 
    
    
    res.json({ draftID: draftID});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'AN ERROR OCCURRED CREATING THE DRAFT' });
  }
};




module.exports = createDraft; 