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
    fb_campaignTitle,
    fb_adsetTitle,
    fb_adTitle,
    productPhotos, 
    uid, 
    productUrl, 
    lastUsedFacebookAdAccount, 
    lastUsedFacebookPixel, 
    lastUsedFacebookPage, 
    facebookAccessToken,
    product
) {
    const data = {
        platform: 'Facebook',
        timestamp: new Date(),
        fb_CampaignTitle: fb_campaignTitle || '',
        fb_AdsetTitle: fb_adsetTitle,
        fb_AdTitle: fb_adTitle,
        fb_PerformanceGoal: 'CONVERSIONS',
        fb_PrimaryTextSelected: fb_PrimaryTextOptions[0],
        fb_PrimaryTextOptions: fb_PrimaryTextOptions,
        fb_HeadlineTextSelected: fb_HeadlineTextOptions[0],
        fb_HeadlineTextOptions: fb_HeadlineTextOptions,
        fb_DescriptionTextSelected: fb_DescriptionTextOptions[0],
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
        fb_SelectedMedia: productPhotos[0]?.src || '',
        fb_StartAt: new Date(),
        fb_Budget: 20,
        status: 'draft',
        userID: uid,
        businessID: businessID,
        media: productPhotos,
        productUrl: productUrl,
        complete_adAccount: Object.keys(lastUsedFacebookAdAccount).length > 0,
        complete_pixel: Object.keys(lastUsedFacebookPixel).length > 0,
        complete_page: Object.keys(lastUsedFacebookPage).length > 0,     
        complete_advancedSettings: true,
        productId: product.product_id,
        createdWithAI: true
    };
    
    const res = await db.collection('drafts').add(data);


  
    return res.id;
}

module.exports = saveDraft;
