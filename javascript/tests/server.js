const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = 'OmniMedia';
const APP_ID = '854522159611705';
const APP_SECRET = '921276dd369dd99d6114fec29729d51f'; // Replace with your actual app secret
const ACCESS_TOKEN = `${APP_ID}|${APP_SECRET}`;
const CALLBACK_URL = 'https://36ac-2600-1009-a021-f0d4-1a7-ad7b-1cc2-ad6.ngrok-free.app/webhook';

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Webhook event handling endpoint
app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log(JSON.stringify(data, null, 2));

    if (data.object === 'adaccount') {
        data.entry.forEach((entry) => {
            const adAccountId = entry.id;
            entry.changes.forEach((change) => {
                handleAdAccountChange(adAccountId, change);
            });
        });
    }
    res.status(200).send('EVENT_RECEIVED');
});

// Function to handle ad account changes
function handleAdAccountChange(adAccountId, change) {
    console.log(`Ad Account ID: ${adAccountId}`);
    console.log('Change:', change);
    // Add your logic to handle the change here
}

// Function to subscribe to Facebook webhook
async function subscribeWebhook() {
    try {
        const response = await axios.post(`https://graph.facebook.com/v14.0/${APP_ID}/subscriptions`, {
            access_token: ACCESS_TOKEN,
            object: 'adaccount',
            callback_url: CALLBACK_URL,
            fields: [
                'id',
                'account_id',
                'name',
                'status',
                'objective',
                'start_time',
                'stop_time',
                'daily_budget',
                'lifetime_budget'
            ],
            include_values: true,
            verify_token: VERIFY_TOKEN
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Subscription response:', response.data);
    } catch (error) {
        console.error('Error subscribing to webhook:', error.response ? error.response.data : error.message);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    subscribeWebhook();
});
