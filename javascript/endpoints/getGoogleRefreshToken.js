
const axios = require('axios');
const shopifyDomain = 'instant-viral.myshopify.com';
// Replace these placeholders with your actual values

async function getGoogleRefreshToken(db, userId) {
    console.log(userId);
    const userRef = db.collection('users').doc(userId);
    const docSnap = await userRef.get();
    const businessID = docSnap.data().businessID;
    const busRef = db.collection('businesses').doc(businessID);
    const busSnap = await busRef.get();
    const authCode = busSnap.data().googleOAuthCode; 
    console.log("business ID is ",businessID);

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

   
    const redirectUri = 'http://localhost:3010/process-google-redirect';
    const authorizationCode = authCode;

    // OAuth token endpoint
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';

    // Data to be sent in the POST request
    const data = {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: authorizationCode,
        grant_type: 'authorization_code'
    };

    // Make a POST request to the token endpoint
    axios.post(tokenEndpoint, data)
        .then(async response => {
            const refreshToken = response.data.refresh_token;
            console.log('Refresh token:', refreshToken);


            await busRef.update({refreshToken: refreshToken});

        
        })
        .catch(error => {
            console.error('Error:', error.response.data.error);
        });
}

module.exports = getGoogleRefreshToken;
