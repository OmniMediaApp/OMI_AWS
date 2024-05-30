//const puppeteer = require('puppeteer'); //!!!!!! npm install puppeteer@16.2.0
const getBusinessData = require('./component/getBusinessData');
const generateContent = require('./component/generateContent')
const scrapeWebpage = require('./component/scrapeWebpage')
const checkInterestsWithFacebook = require('./component/facebookInterests')
const facebookLocationSuggestions = require('./component/facebookLocations')
const saveDraft = require('./component/saveDraft');
const getShopifyProduct = require('../databaseQueries/getShopifyProduct');

async function createDraft(postgres, db, req, res) {

  try {
    //FROM REQUEST
    const scrape = req.query.scrape;
    const product = JSON.parse(req.query.product) || '';
    const product_id = req.query.product_id;
    const uid = req.query.uid;

    //FROM FIRESTORE
    const businessData = await getBusinessData(db, uid);
    const businessID = businessData.businessID;
    const lastUsedFacebookAdAccount = businessData.lastUsedFacebookAdAccount;
    const lastUsedFacebookPixel = businessData.lastUsedFacebookPixel;
    const lastUsedFacebookPage = businessData.lastUsedFacebookPage;
    const facebookAccessToken = businessData.facebookAccessToken;

    //GETTING THE PRODUCT INFO
    let productInfo = '';
    if (scrape == 'true') {
      productInfo = await getProductInfo(postgres, product_id);
    } else {
      let imageInfoArray = [];
      for (let i = 0; i < product.images.length; i++) {
        imageInfoArray.push({src: product.images[i]?.img_src})
      }
      productInfo = {
        imageInfoArray: imageInfoArray,
        product_name: product.product_title,
        product_description: product.description
      }
      //console.log(productInfo)
    }
    if (!productInfo) {
      res.status(500).json({ error: 'Failed to scrape product information.' });
      return;    
    }
    const productUrl = product.online_store_url;



    //GETTING AND PARSING THE AI RESPONSE
    const aiResponse = await generateContent(productInfo.product_name, productInfo.product_description);
    const aiResponseLines = aiResponse.split('\n');
    const fb_PrimaryText1 = aiResponseLines[0].substring(3).trim();
    const fb_PrimaryText2 = aiResponseLines[1].substring(3).trim();
    const fb_PrimaryText3 = aiResponseLines[2].substring(3).trim();
    const fb_PrimaryText4 = aiResponseLines[3].substring(3).trim();
    const fb_PrimaryText5 = aiResponseLines[4].substring(3).trim();
    const fb_HeadlineText1 = aiResponseLines[5].substring(3).trim();
    const fb_HeadlineText2 = aiResponseLines[6].substring(3).trim();
    const fb_HeadlineText3 = aiResponseLines[7].substring(3).trim();
    const fb_HeadlineText4 = aiResponseLines[8].substring(3).trim();
    const fb_HeadlineText5 = aiResponseLines[9].substring(3).trim();
    const fb_DescriptionText1 = aiResponseLines[10].substring(3).trim();
    const fb_DescriptionText2 = aiResponseLines[11].substring(3).trim();
    const fb_DescriptionText3 = aiResponseLines[12].substring(3).trim();
    const fb_DescriptionText4 = aiResponseLines[13].substring(3).trim();
    const fb_DescriptionText5 = aiResponseLines[14].substring(3).trim();
    const fb_Location = aiResponseLines[15].substring(3).trim();
    const fb_Age = aiResponseLines[16].substring(3).trim();
    const fb_Gender = aiResponseLines[17].substring(3).trim();
    const fb_Interests = aiResponseLines[18].substring(3).trim();
    const fb_CTA = aiResponseLines[19].substring(3).trim();


    //GETTING ALL POSSIBLE LOCATIONS AND INTERESTS FROM FACEBOOK
    const fb_VerifiedInterests = await checkInterestsWithFacebook(fb_Interests, facebookAccessToken)
    const fb_LocationSuggestions = await facebookLocationSuggestions(fb_Location, facebookAccessToken)

    const fb_PrimaryTextOptions = [fb_PrimaryText1, fb_PrimaryText2, fb_PrimaryText3, fb_PrimaryText4, fb_PrimaryText5]
    const fb_HeadlineTextOptions = [fb_HeadlineText1, fb_HeadlineText2, fb_HeadlineText3, fb_HeadlineText4, fb_HeadlineText5]
    const fb_DescriptionTextOptions = [fb_DescriptionText1, fb_DescriptionText2, fb_DescriptionText3, fb_DescriptionText4, fb_DescriptionText5]

    //SAVING THE DRAFT TO FIRESTORE
    const draftID = await saveDraft(
      db, 
      businessID, 
      fb_PrimaryTextOptions,
      fb_HeadlineTextOptions,
      fb_DescriptionTextOptions, 
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
    
    console.log('DRAFT ID:', draftID)
    res.json({ draftID: draftID});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'AN ERROR OCCURRED CREATING THE DRAFT' });
  }
};




async function getProductInfo(product_id) {
  try {
    const response = await getShopifyProduct(product_id);
    return response;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}





module.exports = createDraft; 