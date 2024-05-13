const axios = require('axios');

async function getFacebookAccessToken(db, userID) {
    const appID = '854522159611705';
    const appSecret = '921276dd369dd99d6114fec29729d51f';
    const redirectURI = 'http://localhost:3010/process-facebook-redirect';

    console.log(userID);
    const userRef = db.collection('users').doc(userID);
    const docSnap = await userRef.get();
    const businessID = docSnap.data().businessID;
    const busRef = db.collection('businesses').doc(businessID);
    const busSnap = await busRef.get();
    const authCode = busSnap.data().facebookOAuthCode; 
    console.log("business ID is ",businessID);

    try {
        const response = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
            params: {
                client_id: appID,
                client_secret: appSecret,
                redirect_uri: redirectURI,
                code: authCode
            }
        });

        if (response.data && response.data.access_token) {
            await busRef.update({
                facebookAccessToken: response.data.access_token,
                facebookAccessTokenCreatedAt: new Date(),
                facebookAccessTokenNeverUsed: true,
            });

            return response.data.access_token;
        } else {
            throw new Error('Failed to get access token from Facebook.');
        }
    } catch (error) {
        throw error;
    }
}



module.exports = getFacebookAccessToken;