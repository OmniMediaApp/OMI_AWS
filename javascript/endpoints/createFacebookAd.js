const axios = require('axios');
const fs = require('fs');
const adsSdk = require('facebook-nodejs-business-sdk');

async function createFacebookAd(db, req, res) {
    const uid = req.body.uid;
    const draftID = req.body.draftID;

    try {
        const businessData = await getBusinessData(db, uid);
        const facebookAccessToken = businessData.facebookAccessToken;
        const api = adsSdk.FacebookAdsApi.init(facebookAccessToken);

        const draftData = await getDraftData(db, draftID);
        const adDetails = await prepareAdDetails(draftData, facebookAccessToken);

        const campaignID = await createCampaign(adDetails, api);
        const adSetID = await createAdSet(adDetails, api, campaignID);
        const adCreativeID = await createAdCreative(adDetails, api);
        const adID = await createAd(adDetails, api, adSetID, adCreativeID);

        const adRef = await saveAdsToAdsTree(db, adID, adSetID, campaignID, adDetails.adAccountId, uid, draftID);
        await saveAdsRefToDrafts(db, draftID, adRef);
        await saveAdsRefToProducts(db, draftID, adRef);

        res.status(200).send({ data: 'success' });
    } catch (error) {
        console.error('Error creating Facebook ad:', error);
        res.status(500).send({ data: error.message });
    }
}

async function getBusinessData(db, uid) {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error('User doesn\'t exist');

    const businessRef = db.collection('businesses').doc(userDoc.data().businessID);
    const businessDoc = await businessRef.get();
    if (!businessDoc.exists) throw new Error('Business doesn\'t exist');

    return {
        businessID: userDoc.data().businessID,
        facebookAccessToken: businessDoc.data().facebookAccessToken,
    };
}

async function getDraftData(db, draftID) {
    const draftRef = db.collection('drafts').doc(draftID);
    const draftData = await draftRef.get();
    if (!draftData.exists) throw new Error('Draft doesn\'t exist');

    return draftData.data();
}

async function prepareAdDetails(draftData, facebookAccessToken) {
    const adAccountId = draftData.fb_AdAccount.account_id;
    const imageHash = 1 //= await uploadImageToFacebook(draftData.selectedAdPhoto, facebookAccessToken, adAccountId);

    return {
        adAccountId,
        campaignName: draftData.optimizedProductName + " Campaign",
        adSetName: draftData.optimizedProductName + " Ad Set",
        pixelID: draftData.fb_Pixel.pixel_id,
        adName: draftData.optimizedProductName + " Ad",
        pageId: draftData.fb_Page.id,
        imageHash,
        adLink: draftData.productUrl,
        adMessage: draftData.fb_PrimaryText,
        headlineText: draftData.fb_HeadlineText,
        descriptionText: draftData.fb_DescriptionText,
        selectedInterest: draftData.fb_InterestSelected,
        adGender: draftData.fb_Gender,
        adAge: draftData.fb_Age,
        adCTA: draftData.fb_CTA,
        budget: draftData.fb_Budget * 100,
        productId: draftData.productId,
    };
}

async function createCampaign(adDetails, api) {
    const adAccount = new adsSdk.AdAccount(adDetails.adAccountId);
    const campaignParams = {
        name: adDetails.selectedInterest.name + " Campaign",
        objective: adsSdk.Campaign.Objective.outcome_sales,
        status: adsSdk.Campaign.Status.paused,
        special_ad_categories: "NONE",
    };

    const campaign = await adAccount.createCampaign([adsSdk.Campaign.Fields.id], campaignParams);
    return campaign.id;
}

async function createAdSet(adDetails, api, campaignID) {
    const adAccount = new adsSdk.AdAccount(adDetails.adAccountId);
    const adSetParams = {
        name: adDetails.selectedInterest.name + " Ad Set",
        campaign_id: campaignID,
        status: adsSdk.AdSet.Status.active,
        targeting: {
            geo_locations: { countries: ['US'] },
            interests: [{ id: adDetails.selectedInterest.id, name: adDetails.selectedInterest.name }],
            genders: mapGender(adDetails.adGender),
            age_min: adDetails.adAge[0],
            age_max: adDetails.adAge[1],
        },
        daily_budget: adDetails.budget,
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        billing_event: "IMPRESSIONS",
        optimization_goal: 'OFFSITE_CONVERSIONS',
        pacing_type: ['standard'],
        promoted_object: {
            custom_event_type: 'PURCHASE',
            pixel_id: adDetails.pixelID,
        },
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2025-02-01T00:00:00Z',
    };

    const adSet = await adAccount.createAdSet([adsSdk.AdSet.Fields.id], adSetParams);
    return adSet.id;
}

async function createAdCreative(adDetails, api) {
    const adAccount = new adsSdk.AdAccount(adDetails.adAccountId);
    const ctaButtonParams = {
        type: adDetails.adCTA,
        value: { link: adDetails.adLink },
    };

    const adCreativeParams = {
        name: 'Ad Creative Name',
        object_story_spec: {
            page_id: adDetails.pageId,
            link_data: {
                image_hash: adDetails.imageHash,
                link: adDetails.adLink,
                message: adDetails.adMessage,
                call_to_action: ctaButtonParams,
                name: adDetails.headlineText,
                description: adDetails.descriptionText,
            },
        },
        'degrees_of_freedom_spec': {
            'creative_features_spec': {
                'standard_enhancements': {
                    'enroll_status': 'OPT_OUT',
                },
            },
        },
    };

    const adCreative = await adAccount.createAdCreative([adsSdk.AdCreative.Fields.id], adCreativeParams);
    return adCreative.id;
}

async function createAd(adDetails, api, adSetID, adCreativeID) {
    const adAccount = new adsSdk.AdAccount(adDetails.adAccountId);
    const adParams = {
        name: adDetails.selectedInterest.name + " Ad",
        adset_id: adSetID,
        creative: { creative_id: adCreativeID },
        status: adsSdk.Ad.Status.paused,
    };

    const ad = await adAccount.createAd([adsSdk.Ad.Fields.id], adParams);
    return ad.id;
}

async function saveAdsToAdsTree(db, adID, adSetID, campaignID, adAccountId, uid, draftID) {
    const data = {
        adId: [adID],
        adSetId: [adSetID],
        campaignId: [campaignID],
        uid,
        draftID,
        timestamp: new Date(),
        adAccountId,
        imported: false,
    };

    const res = await db.collection('ads').add(data);
    return res.id;
}

async function saveAdsRefToDrafts(db, draftID, adRef) {
    const docRef = db.collection('drafts').doc(draftID);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) throw new Error('Document does not exist');

    const existingData = docSnapshot.data();
    const existingAdRefArray = existingData.adRef || [];
    existingAdRefArray.push(adRef);

    await docRef.update({ adRef: existingAdRefArray });
}

async function saveAdsRefToProducts(db, draftID, adRef) {
    const draftDocRef = db.collection('drafts').doc(draftID);
    const draftDocSnapshot = await draftDocRef.get();
    const productId = draftDocSnapshot.data().productId;

    const docRef = db.collection('products').doc(productId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) throw new Error('Document does not exist');

    const existingData = docSnapshot.data();
    const existingAdRefArray = existingData.adRef || [];
    existingAdRefArray.push(adRef);

    await docRef.update({ adRef: existingAdRefArray });
}

function mapGender(adGender) {
    if (adGender === 'all') return [0];
    if (adGender === 'men') return [1];
    if (adGender === 'women') return [2];
    return [];
}

async function uploadImageToFacebook(fileUrl, facebookAccessToken, adAccountId) {
    try {
        const { data } = await axios.get(fileUrl, { responseType: 'stream' });

        const boundary = '-------------------------' + Date.now().toString(16);

        const formData = `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="access_token"\r\n\r\n${facebookAccessToken}\r\n` +
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="ad_account_id"\r\n\r\n${adAccountId}\r\n` +
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="filedata"; filename="file.jpg"\r\n` +
            'Content-Type: image/jpeg\r\n\r\n';

        const formDataBuffer = Buffer.from(formData, 'utf-8');
        const fileDataBuffer = await streamToBuffer(data);
        const boundaryBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
        const requestDataBuffer = Buffer.concat([formDataBuffer, fileDataBuffer, boundaryBuffer]);

        const response = await axios.post(`https://graph.facebook.com/v18.0/${adAccountId}/adimages`, requestDataBuffer, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': requestDataBuffer.length,
            },
        });

        const responseData = response.data;
        if (responseData.images) {
            const imageHash = Object.keys(responseData.images).map((key) => responseData.images[key].hash)[0];
            return imageHash;
        } else {
            throw new Error('Could not get the image hash.');
        }
    } catch (error) {
        throw new Error('Upload failed: ' + error.message);
    }
}

async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (error) => reject(error));
    });
}

module.exports = createFacebookAd;
