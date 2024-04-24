const axios = require('axios');

//const dateStart = '2024-02-09';
//const dateEnd = '2024-02-09';
const shopifyDomain = 'instant-viral.myshopify.com';
const desiredTimezoneOffset = '-05:00'; // New York timezone offset
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;



async function saveShopifyStats(db) {

  const today = new Date();
  today.setDate(today.getDate() - 1); // Subtract one day to get yesterday's date

  const timeZoneOffset = -5; // New York timezone offset is UTC-5
  const utcTimestamp = today.getTime() + (today.getTimezoneOffset() * 60000);
  const adjustedTimestamp = utcTimestamp + (timeZoneOffset * 3600000);
  const adjustedDate = new Date(adjustedTimestamp);

  const dateStart = adjustedDate.toISOString().split('T')[0];
  const dateEnd = adjustedDate.toISOString().split('T')[0];



  try {



    let nextPage = `https://${shopifyDomain}/admin/api/2022-10/orders.json?status=any&fields=total_price,line_items,order_number,created_at,financial_status&created_at_min=${dateStart}T00:00:00${desiredTimezoneOffset}&created_at_max=${dateEnd}T23:59:59${desiredTimezoneOffset}&limit=${250}`;

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalProfit = 0;
    let totalCOGS = 0;
    let averageOrderValue =0;
    const hourlyRevenue = {};
    const hourlyOrders = {};
    const hourlyCOGS = {};
    const hourlyProfit = {};

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
      const COGS = await getCOGS();
      //console.log(COGS)




      let orders = [];
      for (let i = 0; i < response.data.orders.length; i++) {
        for (let j = 0; j < response.data.orders[i].line_items.length; j++) {
          orders.push({
            productID: response.data.orders[i].line_items[j].product_id,
            quantity: response.data.orders[i].line_items[j].quantity,
            orderNumber: response.data.orders[i].order_number,
            createdAt: response.data.orders[i].created_at,
            totalPrice: response.data.orders[i].line_items[j].price_set.presentment_money.amount * 1,
          });
        }
      }






      let allData = []
      for (let i = 0; i < orders.length; i++) {
        for (let j = 0; j < COGS.length; j++) {
          if (orders[i].productID == COGS[j].productID) {
            totalProfit += (orders[i].totalPrice * 1) - (COGS[j].productCost * 1);
            allData.push({
              createdAt: orders[i].createdAt,
              totalPrice: orders[i].totalPrice,
              orderNumber: orders[i].orderNumber,
              productID: orders[i].productID,
              productCost: COGS[j].productCost,
              profit: (orders[i].totalPrice * 1) - (COGS[j].productCost * 1),
              quantity: orders[i].quantity,
            })
          }
        }
      }

      console.log(allData)


      for (let i = 0; i < allData.length; i++) {
        totalRevenue = totalRevenue + (allData[i].totalPrice * 1);
        totalOrders = totalOrders + 1;
        console.log("Product Cost:", allData[i].productCost, "Quantity:", allData[i].quantity);
        totalCOGS += allData[i].productCost * allData[i].quantity;
        


        for (let hour = 0; hour < 24; hour++) {
          hourlyRevenue[hour] = 0;
          hourlyOrders[hour] = 0;
          hourlyCOGS[hour] = 0;
          hourlyProfit[hour] = 0;
        }

        // Loop through each order and add revenue to the corresponding hour
        for (let i = 0; i < allData.length; i++) {
          const order = allData[i];
          const orderTotalPrice = order.totalPrice * 1;
          const orderTotalCOGS = order.productCost * 1;
          const orderTotalProfit = order.profit * 1;
          const orderCreatedAt = new Date(order.createdAt);
          orderCreatedAt.setHours(orderCreatedAt.getHours() - 5); // Subtract 5 hours
          const hour = orderCreatedAt.getHours(); // Get the updated hour
          hourlyRevenue[hour] += orderTotalPrice;
          hourlyCOGS[hour] += orderTotalCOGS;
          hourlyProfit[hour] += orderTotalProfit;
          hourlyOrders[hour] += 1;
        }
      }

      // Check if there is a next page
      nextPage = getNextPageLink(response.headers.link);
    }
    averageOrderValue = totalRevenue / totalOrders;

    await saveToDB({ totalRevenue: totalRevenue, totalOrders: totalOrders,totalCOGS: totalCOGS, totalProfit: totalProfit, hourlyRevenue: hourlyRevenue, hourlyOrders: hourlyOrders, hourlyCOGS: hourlyCOGS, hourlyProfit: hourlyProfit });
    return { totalRevenue: totalRevenue, totalOrders: totalOrders,totalCOGS: totalCOGS, totalProfit: totalProfit, hourlyRevenue: hourlyRevenue, hourlyOrders: hourlyOrders, hourlyCOGS: hourlyCOGS, hourlyProfit: hourlyProfit };
  } catch (error) {
    // Handle errors
    console.error('Error fetching Shopify orders:', error);
    throw error; // Re-throw the error to propagate it
  }

  async function saveToDB(data) {
    const res = await db.collection('ShopifyStoreStats').doc(shopifyDomain).collection('dates').doc(dateEnd).set(data);
  }


  async function getCOGS() {
    const COGSRef = db.collection('ShopifyProductCOGS').doc(shopifyDomain);
    const doc = await COGSRef.get();
    return doc.data().data
  }
}






function getNextPageLink(linkHeader) {
  // Implement your logic to extract the next page link from the linkHeader
  return null; // For simplicity, returning null here. You should implement this logic.
}

module.exports = saveShopifyStats;

