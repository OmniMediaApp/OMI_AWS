async function saveDraft(
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
    productPhotos, 
    uid, 
    productUrl, 
    lastUsedFacebookAdAccount, 
    lastUsedFacebookPixel, 
    lastUsedFacebookPage, 
    facebookAccessToken
    ) {
  

        console.log(fb_Age)
  
    const data = {
      platform: 'Facebook',
      timestamp: new Date(),
      fb_PrimaryTextOptions: fb_PrimaryTextOptions,
      fb_HeadlineTextOptions: fb_HeadlineTextOptions,
      fb_DescriptionTextOptions: fb_DescriptionTextOptions,
      fb_LocationSelected: fb_LocationSuggestions[0],
      fb_LocationSuggestions: fb_LocationSuggestions,
      fb_Age: JSON.parse(fb_Age),
      fb_Gender: fb_Gender,
      fb_VerifiedInterests: fb_VerifiedInterests,
      fb_InterestSelected: fb_VerifiedInterests[0],
      fb_CTA: fb_CTA,
      fb_AdAccount: Object.keys(lastUsedFacebookAdAccount).length > 0 ? lastUsedFacebookAdAccount : {},
      fb_Pixel: Object.keys(lastUsedFacebookPixel).length > 0 ? lastUsedFacebookPixel : {},
      fb_Page: Object.keys(lastUsedFacebookPage).length > 0 ? lastUsedFacebookPage : {},
      fb_SelectedMedia: productPhotos[0]?.src === undefined ? '' : productPhotos[0]?.src,
      fb_AdRef: '',
      fb_StartAtDate: new Date().toISOString().slice(0, 10),
      fb_StartAtTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      fb_Budget: 20,
      status: 'draft',
      userID: uid,
      businessID: businessID,
      media: productPhotos,
      productUrl: productUrl,
      complete_productPhotos: true,
      complete_targeting: true,
      complete_location: true,
      complete_budget: true,
      complete_age: true,
      complete_gender: true,
      complete_schedule: true,
      complete_adAccount: Object.keys(lastUsedFacebookAdAccount).length > 0 ? true : false,
      complete_pixel: Object.keys(lastUsedFacebookPixel).length > 0 ? true : false,
      complete_page: Object.keys(lastUsedFacebookPage).length > 0 ? true : false,     
      complete_advancedSettings: true,
      productId: ''
    };
    
  const res = await db.collection('drafts').add(data);
  //const productId = await createProductInFirebase(db, res.id, productUrl, optimizedProductName, uid, productPhotos)
  //await addProductIdToDraft (db, res.id, productId)
  
  return res.id;
  }
  
  
  async function createProductInFirebase(db, draftId, productUrl, optimizedProductName, uid, productPhotos) {
      const sanitizedUrl = productUrl;
      const sanitizedProductName = optimizedProductName.replace(/^"|"$/g, '');
  
      // Check if a product with the same URL already exists
      const querySnapshot = await db.collection('products').where('productUrl', '==', sanitizedUrl).get();
      if (!querySnapshot.empty) {
          // If it exists, return the ID of the first matching document
          return querySnapshot.docs[0].id;
      }
  
      // If it doesn't exist, create a new product
      const data = {
          productUrl: sanitizedUrl,
          optimizedProductName: sanitizedProductName,
          status: 'draft',
          user: uid,
          draftId: draftId,
          fb_SelectedMedia: productPhotos[0]?.src || '',
          fb_AdRef: [],
      }
  
      try {
          const res = await db.collection('products').add(data);
          return res.id;
      } catch (error) {
          console.error("Error creating product in Firebase:", error);
          // Handle the error appropriately
      }
  }
  
  
  
  async function addProductIdToDraft (db, draftId, productId) {
      const docRef = db.collection('drafts').doc(draftId);
      const res = await docRef.update({productId: productId});
  }



module.exports = saveDraft;