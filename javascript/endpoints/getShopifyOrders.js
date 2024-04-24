const axios = require('axios');

//const dateStart = '2024-02-09';
//const dateEnd = '2024-02-09';
//const shopifyDomain = 'instant-viral.myshopify.com';
const desiredTimezoneOffset = '-05:00'; // New York timezone offset



async function getShopifyOrders(db, req) {


  const today = new Date();
  const timeZoneOffset = -5; // New York timezone offset is UTC-5
  const utcTimestamp = today.getTime() + (today.getTimezoneOffset() * 60000);
  const adjustedTimestamp = utcTimestamp + (timeZoneOffset * 3600000);
  const adjustedDate = new Date(adjustedTimestamp);
  
  const dateStart = adjustedDate.toISOString().split('T')[0];
  const dateEnd = adjustedDate.toISOString().split('T')[0];
  
  const uid = req.query.uid;
  const limit = req.query.limit;


  async function getStoreData(uid) {
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
          shopifyAdminAccessToken: businessDoc.data().shopifyAdminAccessToken,
          shopifyDomain: businessDoc.data().shopifyDomain,
          facebookAccessToken: businessDoc.data().facebookOAuthAccessToken,
        }
      } 
    } 
  }
  const storeData = await getStoreData(uid);
  const shopifyDomain = storeData.shopifyDomain;
  const accessToken = storeData.shopifyAdminAccessToken

  try {
    function capitalizeWords(str) {
      // Split the string into words
      const words = str.trim().split(/\s+/);
      // Remove the first word if it is null or empty
      if (words.length > 0 && (words[0] === 'null' || words[0] === '')) {
        words.shift();
      }
    
      // Capitalize each word
      return words.map(word => word.toLowerCase().replace(/^\w/, c => c.toUpperCase())).join(' ');
    }


    let orders = [];
    let nextPage = `https://${shopifyDomain}/admin/api/2022-10/orders.json?status=any&fields=total_price,line_items,order_number,created_at,contact_email,financial_status,fulfillment_status,tags,customer&created_at_min=${dateStart}T00:00:00${desiredTimezoneOffset}&created_at_max=${dateEnd}T23:59:59${desiredTimezoneOffset}&limit=${limit}`;

    let totalRevenue = 0; 
    let totalOrders = 0;
    const hourlyRevenue = {};

    while (nextPage) {
      const config = {
        method: 'get',
        url: nextPage,
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      };

      console.log(config.url);
      const response = await axios(config);
      //console.log(response.data)

      for (let i = 0; i < response.data.orders.length; i++) {

        for (let hour = 0; hour < 24; hour++) {
          hourlyRevenue[hour] = 0;
        }
  
        // Loop through each order and add revenue to the corresponding hour
        for (let i = 0; i < response.data.orders.length; i++) {
          const order = response.data.orders[i];
          const orderTotalPrice = order.total_price * 1;
          const orderCreatedAt = new Date(order.created_at);
          const hour = orderCreatedAt.getHours() - 5; // Adjusting for timezone
          hourlyRevenue[hour] += orderTotalPrice;
        }

        totalRevenue = totalRevenue + (response.data.orders[i].total_price * 1);
        totalOrders = totalOrders + 1;
        for (let j = 0; j < response.data.orders[i].line_items.length; j++) {
          orders.push({
            productID: response.data.orders[i].line_items[j].product_id,
            productName: response.data.orders[i].line_items[j].name,
            quantity: response.data.orders[i].line_items[j].quantity,
            orderNumber: response.data.orders[i].order_number,
            createdAt: response.data.orders[i].created_at,
            customer: response.data.orders[i].customer,
            customerName: capitalizeWords(response.data.orders[i]?.customer?.first_name + " " + response.data.orders[i]?.customer?.last_name),
            contactEmail: response.data.orders[i].contact_email,
            financialStatus: response.data.orders[i].financial_status,
            fulfillmentStatus: response.data.orders[i].fulfillment_status,
            tags: response.data.orders[i].tags,
            totalPrice: response.data.orders[i].line_items[j].price_set.presentment_money.amount * 1,
          });
        }
      }

      // Check if there is a next page
      nextPage = getNextPageLink(response.headers.link);
    }

    return { orders: orders, totalRevenue: totalRevenue, totalOrders: totalOrders, hourlyRevenue: hourlyRevenue };
  } catch (error) {
    // Handle errors
    console.error('Error fetching Shopify orders:', error);
    throw error; // Re-throw the error to propagate it
  }
}

function getNextPageLink(linkHeader) {
  // Implement your logic to extract the next page link from the linkHeader
  return null; // For simplicity, returning null here. You should implement this logic.
}

module.exports = getShopifyOrders;
