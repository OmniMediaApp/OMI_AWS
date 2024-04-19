const axios = require('axios');
const fs = require('fs');

//changes

async function createFacebookAd (db, req, res) {
    
    const adsSdk = require('facebook-nodejs-business-sdk');
    const uid = request.query.uid;
    const draftId = request.query.draftId;
    //const adAccountId = request.query.adAccountId;
    //const campaignName = request.query.campaignName;
    //const adSetName = request.query.adSetName;
    //const pixelID = request.query.pixelID;
    //const adName = request.query.adName;
    //const pageId = request.query.pageId;
    //const imageHash = request.query.imageHash;
    //const adLink = request.query.adLink;
    //const adMessage = request.query.adMessage;

    
    async function getBusinessData(db, uid) {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          console.log('User doesnt exist');
        } else {
          const businessRef = db.collection('businesses').doc(userDoc.data().businessID);
          const businessDoc = await businessRef.get();
          if (!businessDoc.exists) {
            console.log('User doesnt exist');
          } else {
            return {
              businessID: userDoc.data().businessID,
              facebookAccessToken: businessDoc.data().facebookOAuthAccessToken,
            }
          } 
        } 
    }

    const businessData = await getBusinessData();

    const facebookAccessToken = businessData.facebookAccessToken;



    const api = adsSdk.FacebookAdsApi.init(facebookAccessToken);


    const draftRef = db.collection('drafts').doc(draftId);
    const draftData = await draftRef.get();
    if (!draftData.exists) {
        console.log("Draft doesn't exist.");
    } else {
        console.log("ACCESS TOKEN: " + accessToken)
        console.log("Ad Account ID: " + draftData.data().fb_AdAccount.account_id)
        console.log("FILE URL: " + draftData.data().fb_SelectedMedia)
        console.log("UID: " + uid)
        console.log("DRAFT ID: " + draftId)
        const adAccountId = draftData.data().fb_AdAccount.account_id;
        const campaignName = draftData.data().optimizedProductName + " Campaign"; 
        const adSetName = draftData.data().optimizedProductName + " Ad Set";
        const pixelID = draftData.data().fb_Pixel.id;
        const adName = draftData.data().optimizedProductName + " Ad";
        const pageId = draftData.data().fb_Page.id;
        const imageHash = await uploadImageToFacebook(draftData.data().selectedAdPhoto, facebookAccessToken, adAccountId);
        const adLink = draftData.data().productUrl;
        const adMessage = draftData.data().fb_PrimaryText;
        const headlineText = draftData.data().fb_HeadlineText;
        const descriptionText = draftData.data().fb_DescriptionText;
        const selectedInterest = draftData.data().fb_InterestSelected
        const adGender = draftData.data().fb_Gender;
        const adAge = draftData.data().fb_Age;
        const adCTA = draftData.data().fb_CTA;          
        const budget = (draftData.data().fb_Budget) * 100;  
        const productId = draftData.data().productId;          



        const minAge = adAge[0];
        const maxAge = adAge[1];

        console.log("Image Hash" + imageHash)
        console.log("MIN AGE: " + minAge)
        console.log("MAX AGE: " + maxAge)

        let gendersArray = [];
        if (adGender === 'all') {
        gendersArray = [0]; // Target all genders
        } else if (adGender === 'men') {
        gendersArray = [1]; // Target male
        } else if (adGender === 'women') {
        gendersArray = [2]; // Target female
        }



        const adIDs = []
        const adSetIDs = []
        const campaignIDs = []



        const userRef = db.collection('users').doc(uid);

        const res = await userRef.set({
            lastUsedFacebookAdAccount: draftData.data().facebookAdAccount,
            lastUsedFacebookPage: draftData.data().facebookPage,
            lastUsedFacebookPixel: draftData.data().facebookPixel,
        }, { merge: true });





        // Create a new AdAccount instance
        const adAccount = new adsSdk.AdAccount("act_" + adAccountId);

        // Create a new Campaign
        const campaignParams = {
        name: selectedInterest.name + " Campaign",//VARIABLE
        objective: adsSdk.Campaign.Objective.outcome_sales,
        status: adsSdk.Campaign.Status.paused,
        special_ad_categories: "NONE",

        };

        adAccount.createCampaign([adsSdk.Campaign.Fields.id], campaignParams)
        .then((campaign) => {
            campaignIDs.push(campaign.id)
            console.log('Campaign created:', campaignIDs[0]);

            // Create an AdSet
            const adSetParams = {
            name: selectedInterest.name + " Ad Set",//VARIABLE
            campaign_id: campaign.id,
            status: adsSdk.AdSet.Status.active,
            targeting: {
                geo_locations: {countries: ['US']},
                interests: [
                    { id: selectedInterest.id, name: selectedInterest.name },
                ],
                genders: gendersArray,
                age_min: minAge, // Minimum age
                age_max: maxAge, // Maximum age
            },
            daily_budget: budget, // Daily budget in cents
            bid_strategy: "LOWEST_COST_WITHOUT_CAP", // Bid amount in cents
            billing_event: adsSdk.AdSet.BillingEvent.impressions,
            optimization_goal: adsSdk.AdSet.OptimizationGoal.offsite_conversions,
            pacing_type: ['standard'],
            promoted_object: {
                custom_event_type: 'PURCHASE',
                pixel_id: pixelID, //VARIABLE
            },
            start_time: '2023-01-01T00:00:00Z',
            end_time: '2024-02-01T00:00:00Z',
            };

            adAccount.createAdSet([adsSdk.AdSet.Fields.id], adSetParams)
            .then((adSet) => {
                adSetIDs.push(adSet.id)
                console.log('Ad Set created:', adSetIDs[0]);

                const ctaButtonParams = {
                    type: adCTA, //VARIABLE
                    value: {
                        link: adLink, //VARIABLE
                    },
                    };

                // Create an Ad Creative
                const adCreativeParams = {
                name: 'Ad Creative Name',
                object_story_spec: {
                    page_id: pageId, //VARIABLE
                    link_data: {
                        image_hash: imageHash,//VARIABLE
                        link: adLink, //VARIABLE
                        message: adMessage,//VARIABLE
                        call_to_action: ctaButtonParams,
                        name: headlineText, //VARIABLE
                        description: descriptionText //VARIABLE
                    },
                },
                //ad_format: adsSdk.AdCreative.AdFormat.link,
                'degrees_of_freedom_spec': {
                    'creative_features_spec': {
                        'standard_enhancements': {
                            'enroll_status': 'OPT_OUT'
                        }
                    }
                }
                };


                adAccount.createAdCreative([adsSdk.AdCreative.Fields.id], adCreativeParams)
                .then((adCreative) => {
                    console.log('Ad Creative created:', adCreative.id);

                    // Create an Ad
                    const adParams = {
                    name: selectedInterest.name + " Ad",//VARIABLE
                    adset_id: adSet.id,
                    creative: { creative_id: adCreative.id },
                    status: adsSdk.Ad.Status.paused,
                    };

                    adAccount.createAd([adsSdk.Ad.Fields.id], adParams)
                    .then(async (ad) => {
                        adIDs.push(ad.id)
                        console.log('Ad created:', adIDs[0]);
                        const adRef = await saveAdsToAdsTree(adIDs, adSetIDs, campaignIDs, adAccountId)
                        saveAdsRefToDrafts(adRef)
                        saveAdsRefToProducts(adRef)
                        responses.status(200).send({data: 'success'})
                    })
                    .catch((error) => {
                        console.error('Error creating ad:', error.response);
                        responses.status(200).send({data: error.response})
                    });
                })
                .catch((error) => {
                    console.error('Error creating ad creative:', error.response);
                });
            })
            .catch((error) => {
                console.error('Error creating ad set:', error.response);
            });
        })
        .catch((error) => {
            console.error('Error creating campaign:', error.response);
        });

    }    
    


    async function saveAdsToAdsTree (adId, adSetId, campaignId, adAccountId) {
        const data = {
            adId: adId,
            adSetId: adSetId,
            campaignId: campaignId,
            uid: uid,
            draftId: draftId,
            timestamp: new Date(),
            adAccountId: adAccountId,
            imported: false
          };
          
        const res = await db.collection('ads').add(data);
        return res.id;
    }


   
    async function saveAdsRefToDrafts (adRef) {
        console.log('adRef: ' + adRef);
      
        const docRef = db.collection('drafts').doc(draftId);
      
        try {
          // Retrieve the existing array from Firestore
          const docSnapshot = await docRef.get();
          productId = docSnapshot.data().productId
      
          if (docSnapshot.exists) {
            const existingData = docSnapshot.data();
            const existingAdRefArray = existingData.adRef || [];
      
            // Add the new value to the array
            existingAdRefArray.push(adRef);
      
            // Update the Firestore document with the modified array
            await docRef.update({ adRef: existingAdRefArray });
          } else {
            console.error('Document does not exist');
          }
        } catch (error) {
          console.error('Error updating Firestore document:', error);
        }
    }

    async function saveAdsRefToProducts(adRef) {
        const draftDocRef = db.collection('drafts').doc(draftId);
        const draftDocSnapshot = await draftDocRef.get();
        const productId = draftDocSnapshot.data().productId;

        console.log('adRef: ' + adRef);
      
        const docRef = db.collection('products').doc(productId);
      
        try {
          // Retrieve the existing array from Firestore
          const docSnapshot = await docRef.get();
      
          if (docSnapshot.exists) {
            const existingData = docSnapshot.data();
            const existingAdRefArray = existingData.adRef || [];
      
            // Add the new value to the array
            existingAdRefArray.push(adRef);
      
            // Update the Firestore document with the modified array
            await docRef.update({ adRef: existingAdRefArray });
          } else {
            console.log('Document does not exist');
          }
        } catch (error) {
          console.error('Error updating Firestore document:', error);
        }
      }




    async function uploadImageToFacebook(fileUrl, accessToken, adAccountId) {
        try {
          // Fetch the file from the URL
          const { data } = await axios.get(fileUrl, { responseType: 'stream' });
      
          // Create a boundary for the multipart/form-data
          const boundary = '-------------------------' + Date.now().toString(16);
      
          // Create a FormData-like object manually
          const formData = `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="access_token"\r\n\r\n${accessToken}\r\n` +
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="ad_account_id"\r\n\r\n${adAccountId}\r\n` +
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="filedata"; filename="file.jpg"\r\n` +
            'Content-Type: image/jpeg\r\n\r\n';
      
          // Convert formData to Buffer
          const formDataBuffer = Buffer.from(formData, 'utf-8');
      
          // Create a Buffer with the file data
          const fileDataBuffer = await streamToBuffer(data);
      
          // Create a boundary buffer
          const boundaryBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
      
          // Concatenate all buffers
          const requestDataBuffer = Buffer.concat([
            formDataBuffer,
            fileDataBuffer,
            boundaryBuffer,
          ]);
      
          // Send the request to Facebook's API
          const response = await axios.post(`https://graph.facebook.com/v18.0/act_${adAccountId}/adimages`, requestDataBuffer, {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': requestDataBuffer.length,
            },
          });
      
          const responseData = response.data;
      
          // Log the entire response
          console.log('Upload successful! Server responded with:', responseData);
      
          // Extract the image hash
          if (responseData.images) {
            const imageHash = Object.keys(responseData.images).map((key) => responseData.images[key].hash)[0];
            console.log('Image Hash:', imageHash);
            return imageHash;
          } else {
            console.log('Could not get the image hash.');
          }
        } catch (error) {
          console.error('Upload failed:', error.response);
        }
      }
      
      // Helper function to convert a stream to a buffer
      async function streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', (error) => reject(error));
        });
      }
    



}