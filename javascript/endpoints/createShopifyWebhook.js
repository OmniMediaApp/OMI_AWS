const axios = require('axios');

async function createShopifyWebhook(shopDomain, accessToken, webhookUrl) {
  const url = `https://${shopDomain}/admin/api/2024-01/webhooks.json`;

  const data = {
    webhook: {
      address: webhookUrl,
      topic: 'customers/update',
      format: 'json',
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 201) {
      console.log('Webhook created successfully', response.data.webhook);
      return "Webhook created successfully"
    } else {
      console.log(`Error creating webhook: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error creating webhook: ${error.response.status} ${error.response.statusText}`);
    console.error(error.response.data);
  }
}

// Example usage
// const shopDomain = 'your-development-store.myshopify.com';
// const accessToken = 'your_access_token';
// const webhookUrl = 'https://950a-2600-1009-a021-f16d-bd1e-45e8-571b-28eb.ngrok-free.app/shopify/webhook';


module.exports = createShopifyWebhook;