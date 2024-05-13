const axios = require('axios');


const desiredTimezoneOffset = '-05:00'; // New York timezone offset



async function getShopifyOverview(db, req, res, postgres) {

  const dateStart = req.query.dateStart;
  const dateEnd = req.query.dateEnd;
  const uid = req.query.uid;

  console.log(uid)


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
    // let productCosts = []
    // const COGSRef = db.collection('ShopifyProductCOGS').doc(shopifyDomain);
    // const doc = await COGSRef.get();
    // if (!doc.exists) {
    //   console.log('No such document!');
    // } else {
    //   productCosts = doc.data().data;
    // }
    // return productCosts

    const omniBusinessID = 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd'

      try {
          const result = await postgres.query(`SELECT * FROM public.shopify_products WHERE omni_business_id = '${omniBusinessID}'`);
          console.log('Query result:', result.rows);
          return result.rows;
      } catch (error) {
          console.error('Error executing query:', error);
      }
  
  
  executeQuery();
  

  }



  async function getFacebookSpend(facebookAccessToken, dateStart, dateEnd) {
    try {
      const accessToken = facebookAccessToken;
      const adAccountID = 'act_2044655035664767'

      const url2 = `https://graph.facebook.com/v13.0/${adAccountID}/insights?fields=spend,impressions,clicks,reach&time_range={'since':'${dateStart}','until':'${dateEnd}'}&access_token=${accessToken}`;
      const response = await axios.get(url2);
      const facebookData = response.data;
      //console.log(facebookData)

        return {
          spend: parseFloat(facebookData.data[0].spend),
          impressions: facebookData.data[0].impressions,
          clicks: facebookData.data[0].clicks,
          reach: facebookData.data[0].reach
        };

 
    } catch (error) {
      console.error('Error fetching facebook metrics:', error.response.data);
    }
  }





  async function getData(uid, dateStart, dateEnd) {

    async function getStoreData(uid) {
      const userRef = db.collection('users').doc(uid);
      //console.log(uid)
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
            facebookAccessToken: businessDoc.data().facebookAccessToken,
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
    console.log(productCosts)
    // Merge order data with product data
    const allData = [];

    console.log(orders.length)



    for (let i = 0; i < orders.length; i++) {
      let foundMatch = false; // Flag to track if a match is found for the current order
  
      for (let j = 0; j < productCosts.length; j++) {
          if (orders[i].productID == productCosts[j].product_id) {
              foundMatch = true; // Set the flag to true if a match is found
  
              allData.push({
                  productID: orders[i].productID,
                  quantity: orders[i].quantity,
                  totalPrice: orders[i].totalPrice,
                  orderNumber: orders[i].orderNumber,
                  productName: productCosts[j].product_name,
                  variantTitle: productCosts[j].variant_title,
                  variantID: productCosts[j].variant_id,
                  inventoryID: productCosts[j].inventory_id,
                  productCost: productCosts[j].product_cost,
              });
  
              break; // Exit the inner loop once a match is found
          }
      }
  
      if (!foundMatch) {
          // Handle case where no match is found for the current order
          console.log('No match found for order:', orders[i].orderNumber);
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
        orders: totalOrders,
        sales: totalRevenue,
        cogs: totalProductCost,
        aov: aov,
        productsOrdered: ordersCount,
        facebookSpend: facebookSpend,
        facebookImpressions: facebookImpressions * 1,
        facebookClicks: facebookClicks * 1,
        facebookReach: facebookReach * 1,
        profit: totalRevenue - (totalProductCost + facebookSpend),
    })

  }




  return getData(uid, dateStart, dateEnd)


}

module.exports = getShopifyOverview;
