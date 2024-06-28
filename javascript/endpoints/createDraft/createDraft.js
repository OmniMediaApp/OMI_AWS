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
    console.log('REQUEST:', req.body)
    const product = req.body.product;
    const uid = req.query.uid;


    //FROM FIRESTORE
    const businessData = await getBusinessData(db, uid);
    const businessID = businessData.businessID;
    const lastUsedFacebookAdAccount = businessData.lastUsedFacebookAdAccount;
    const lastUsedFacebookPixel = businessData.lastUsedFacebookPixel;
    const lastUsedFacebookPage = businessData.lastUsedFacebookPage;
    const facebookAccessToken = businessData.facebookAccessToken;



    //GETTING AND PARSING THE AI RESPONSE
    const aiResponse = await generateContent(product.product_title, product.description);
    const aiResponseLines = aiResponse.split('\n');
    
    const removeQuotes = (str) => str.replace(/^"|"$/g, ''); // Function to remove surrounding quotes
    
    const fb_PrimaryText1 = removeQuotes(aiResponseLines[0].substring(3).trim());
    const fb_PrimaryText2 = removeQuotes(aiResponseLines[1].substring(3).trim());
    const fb_PrimaryText3 = removeQuotes(aiResponseLines[2].substring(3).trim());
    const fb_PrimaryText4 = removeQuotes(aiResponseLines[3].substring(3).trim());
    const fb_PrimaryText5 = removeQuotes(aiResponseLines[4].substring(3).trim());
    const fb_HeadlineText1 = removeQuotes(aiResponseLines[5].substring(3).trim());
    const fb_HeadlineText2 = removeQuotes(aiResponseLines[6].substring(3).trim());
    const fb_HeadlineText3 = removeQuotes(aiResponseLines[7].substring(3).trim());
    const fb_HeadlineText4 = removeQuotes(aiResponseLines[8].substring(3).trim());
    const fb_HeadlineText5 = removeQuotes(aiResponseLines[9].substring(3).trim());
    const fb_DescriptionText1 = removeQuotes(aiResponseLines[10].substring(3).trim());
    const fb_DescriptionText2 = removeQuotes(aiResponseLines[11].substring(3).trim());
    const fb_DescriptionText3 = removeQuotes(aiResponseLines[12].substring(3).trim());
    const fb_DescriptionText4 = removeQuotes(aiResponseLines[13].substring(3).trim());
    const fb_DescriptionText5 = removeQuotes(aiResponseLines[14].substring(3).trim());
    const fb_Location = removeQuotes(aiResponseLines[15].substring(3).trim());
    const fb_Age = removeQuotes(aiResponseLines[16].substring(3).trim());
    const fb_Gender = removeQuotes(aiResponseLines[17].substring(3).trim());
    const fb_Interests = removeQuotes(aiResponseLines[18].substring(3).trim());
    const fb_CTA = removeQuotes(aiResponseLines[19].substring(3).trim());
    const fb_campaignTitle = removeQuotes(aiResponseLines[20].substring(3).trim());
    const fb_adsetTitle = removeQuotes(aiResponseLines[21].substring(3).trim());
    const fb_adTitle = removeQuotes(aiResponseLines[22].substring(3).trim());
    


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
      fb_campaignTitle,
      fb_adsetTitle,
      fb_adTitle,
      product.img_src, 
      uid, 
      product.online_store_url, 
      lastUsedFacebookAdAccount, 
      lastUsedFacebookPixel, 
      lastUsedFacebookPage, 
      facebookAccessToken,
      product
    ) 
    
    console.log('DRAFT ID:', draftID)
    res.json({ draftID: draftID});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'AN ERROR OCCURRED CREATING THE DRAFT' });
  }
};









module.exports = createDraft; 