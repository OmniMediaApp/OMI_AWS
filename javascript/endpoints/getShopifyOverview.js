const axios = require('axios');


const desiredTimezoneOffset = '-05:00'; // New York timezone offset



async function getShopifyOverview(db, req, res) {

  const dateStart = req.query.dateStart;
  const dateEnd = req.query.dateEnd;
  const uid = req.query.uid;


  // Get the current date
  const currentDate = new Date();

  // Get year, month, and day in YYYY-MM-DD format
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  async function getOrders(shopifyDomain, shopifyAccessToken) {
    let orders = [];
    let nextPage = `${shopifyDomain}/admin/api/2022-10/orders.json?status=any&fields=total_price,line_items,order_number&created_at_min=${dateStart}T00:00:00${desiredTimezoneOffset}&created_at_max=${dateEnd}T23:59:59${desiredTimezoneOffset}&limit=250`;

    let totalRevenue = 0;
    let totalOrders = 0;

    while (nextPage) {
      const config = {
        method: 'get',
        url: nextPage,
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
        },
      };

      //console.log(config.url);
      const response = await axios(config);

      for (let i = 0; i < response.data.orders.length; i++) {
        totalRevenue = totalRevenue + (response.data.orders[i].total_price * 1)
        totalOrders = totalOrders + 1;
        for (let j = 0; j < response.data.orders[i].line_items.length; j++) {
          orders.push({
            productID: response.data.orders[i].line_items[j].product_id,
            quantity: response.data.orders[i].line_items[j].quantity,
            orderNumber: response.data.orders[i].order_number,
            totalPrice: response.data.orders[i].line_items[j].price_set.presentment_money.amount * 1,
          });
        }
      }

      // Check if there is a next page
      nextPage = getNextPageLink(response.headers.link);
    }

    return { orders: orders, totalRevenue: totalRevenue, totalOrders: totalOrders };
  }



  function getNextPageLink(linkHeader) {
    if (!linkHeader) {
      return null;
    }

    const links = linkHeader.split(', ');
    for (const link of links) {
      const [url, rel] = link.split('; ');
      if (rel.includes('next')) {
        return url.substring(1, url.length - 1); // Remove angle brackets
      }
    }

    return null;
  }








  async function getProductCost(shopifyDomain, shopifyAccessToken, inventoryIDs) {
    let productCosts = []
    const COGSRef = db.collection('ShopifyProductCOGS').doc(shopifyDomain);
    const doc = await COGSRef.get();
    if (!doc.exists) {
      console.log('No such document!');
    } else {
      productCosts = doc.data().data;
    }


    return productCosts

  }



  async function getFacebookSpend(facebookAccessToken, dateStart, dateEnd) {
    try {
      const accessToken = facebookAccessToken;

      // Step 1: Fetch ad accounts
      const url1 = `https://graph.facebook.com/v13.0/me/adaccounts?access_token=${accessToken}`;
      //console.log(url1);
      const response1 = await fetch(url1);
      const data = await response1.json();
      const adAccounts = data.data;

      // Step 2: Fetch ad spend and other metrics for each account
      const spends = await Promise.all(adAccounts.map(async account => {
        const url2 = `https://graph.facebook.com/v13.0/${account.id}/insights?fields=spend,impressions,clicks,reach&time_range={'since':'${dateStart}','until':'${dateEnd}'}&access_token=${accessToken}`;
        //console.log(url2);
        const response2 = await fetch(url2);
        const spendData = await response2.json();
        if (spendData.data.length > 0) {
          return {
            spend: parseFloat(spendData.data[0].spend),
            impressions: spendData.data[0].impressions,
            clicks: spendData.data[0].clicks,
            reach: spendData.data[0].reach
          };
        } else {
          return { spend: 0, impressions: 0, clicks: 0, reach: 0 };
        }
      }));

      // Step 3: Aggregate total metrics
      const totalMetrics = spends.reduce((acc, metrics) => {
        return {
          spend: acc.spend + metrics.spend,
          impressions: acc.impressions + parseInt(metrics.impressions, 10),
          clicks: acc.clicks + parseInt(metrics.clicks, 10),
          reach: acc.reach + parseInt(metrics.reach, 10)
        };
      }, { spend: 0, impressions: 0, clicks: 0, reach: 0 });

      return totalMetrics;
    } catch (error) {
      console.error('Error fetching ad metrics:', error);
      throw error; // Rethrow the error for handling upstream
    }
  }





  async function getData(uid, dateStart, dateEnd) {

    async function getStoreData(uid) {
      const userRef = db.collection('users').doc(uid);
      console.log(uid)
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
    const getOrdersData = await getOrders('https://' + storeData.shopifyDomain, storeData.shopifyAdminAccessToken);
    const facebook = await getFacebookSpend(storeData.facebookAccessToken, dateStart, dateEnd);
    const facebookSpend = facebook.spend;
    const facebookImpressions = facebook.impressions;
    const facebookClicks = facebook.clicks;
    const facebookReach = facebook.reach;
    const orders = getOrdersData.orders;
    const totalRevenue = getOrdersData.totalRevenue;
    const totalOrders = getOrdersData.totalOrders;

    console.log(orders.length);





    const productCosts = await getProductCost(storeData.shopifyDomain, storeData.shopifyAdminAccessToken);
    //console.log(productCosts[2])
    // Merge order data with product data
    const allData = [];

    for (let i = 0; i < orders.length; i++) {
      for (let j = 0; j < productCosts.length; j++) {
        if (orders[i].productID == productCosts[j].productID) {
          allData.push({
            productID: orders[i].productID,
            quantity: orders[i].quantity,
            totalPrice: orders[i].totalPrice,
            orderNumber: orders[i].orderNumber,
            productName: productCosts[j].productName,
            variantTitle: productCosts[j].variantTitle,
            variantID: productCosts[j].variantID,
            inventoryID: productCosts[j].inventoryID,
            productCost: productCosts[j].productCost,
          });
        }
      }
    }

    //console.log(allData)

    // Create a map for productCosts for easy lookup
    const inventoryMap = new Map();
    productCosts.forEach(item => {
      inventoryMap.set(item.inventoryID, item.productCost);
    });

    let totalSales = 0;
    let totalProductCost = 0;
    for (let i = 0; i < allData.length; i++) {
      totalSales = totalSales + allData[i].totalPrice;
      totalProductCost = totalProductCost + allData[i].productCost;
    }

    const ordersCount = orders.length;
    const totalProfit = (totalSales - totalProductCost);
    const aov = totalSales / orders.length;

    //console.log('TOTAL ORDERS: ' + totalOrders)
    //console.log('TOTAL SALES: ' + totalRevenue)
    //console.log('TOTAL COGS: ' + totalProductCost)
    //console.log('TOTAL PROFIT: ' + (totalRevenue - totalProductCost))
    //console.log('TOTAL AOV: ' + totalRevenue / ordersCount)
    //console.log('PRODUCTS ORDERED: ' + ordersCount)
    //console.log('TOTAL AD SPEND: ' + facebookSpend)


    return ({
      data: {
        orders: totalOrders,
        sales: totalRevenue,
        cogs: totalProductCost,
        aov: aov,
        productsOrdered: ordersCount,
        facebookSpend: facebookSpend,
        facebookImpressions: facebookImpressions,
        facebookClicks: facebookClicks,
        facebookReach: facebookReach,
        profit: totalRevenue - (totalProductCost + facebookSpend),
      }
    })

  }




  return getData(uid, dateStart, dateEnd)


}

module.exports = getShopifyOverview;
