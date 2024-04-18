const axios = require('axios');

const shopifyDomain = 'instant-viral.myshopify.com';
const accessToken = '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';

// Placeholder function for getCOGS - you will need to implement this based on your application logic
const customer_id = 4143192746;

async function saveHistoricalShopifyStats(db) {
    const today = new Date(); // Starting point is today
    const oneYearAgo = new Date();
    const oneMonthAgo = new Date();
    
    
    oneYearAgo.setFullYear(today.getFullYear() - 1); // Set to one year ago from today
    oneMonthAgo.setMonth(today.getMonth()-1);
    let dateEnddb;

    let totalRevenue ;
    let totalOrders;
    let totalProfit;
    let totalCOGS;
    let averageOrderValue;
    let googleAdSpend;
    let finalProfit;
    let hourlyRevenue = Array(24).fill(0);
    let hourlyOrders = Array(24).fill(0);
    let hourlyCOGS = Array(24).fill(0);
    let hourlyProfit = Array(24).fill(0);
    let hourlAov = Array(24).fill(0);
    
  let currentDate = new Date(oneMonthAgo)
  
  let h =0; 
  while (h < 7) {
    const day = new Date(today); // Use today's date as the reference for each iteration
    day.setDate(day.getDate() - h); // Adjust for each day in the loop
    const dateFormatted = day.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dateStart = `${dateFormatted}T00:00:00-04:00`; // Adjust timezone if needed
    const dateEnd = `${dateFormatted}T23:59:59-04:00`;  // End of the day in UTC
    dateEnddb= dateFormatted
    googleAdSpend =0;
    try {

      
              
        // Google API call to get ad spend      
        // Assuming dateStart and dateEnd are defined somewhere above this code
            
        const data = {
          start_date: dateEnddb,
          customer_id: customer_id
          
      };
      
      try {
        const apiURL = 'http://13.59.191.31:3001/api/getGoogleSpend';
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else if (!response.headers.get('content-type')?.includes('application/json')) {
            throw new Error('Received non-JSON response');
        }
    
        const result = await response.json();
        if (result && result.hasOwnProperty('cost_dollars')) {
            googleAdSpend = result.cost_dollars;
        } else {
            googleAdSpend= 0;
        }
    } catch (error) {
        console.error('Error: while getting google ad spend', error);
    }
    
    
      

        let nextPage = `https://${shopifyDomain}/admin/api/2022-10/orders.json?status=any&fields=total_price,line_items,order_number,created_at,financial_status&created_at_min=${dateStart}&created_at_max=${dateEnd}&limit=${250}`;
        
        console.log(dateStart);

          totalRevenue = 0;
          totalOrders = 0;
          totalProfit = 0; 
          totalCOGS = 0;
          finalProfit=0;
          averageOrderValue = 0;


          for (let hour = 0; hour < 23; hour++) {
            hourlyRevenue[hour] = 0;
            hourlyOrders[hour] = 0;
            hourlyCOGS[hour] = 0;
            hourlyProfit[hour] = 0;
            hourlAov[hour] = 0;
          }
        while (nextPage) {
          const config = {
            method: 'get',
            url: nextPage,
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
          };
          
          //console.log(config.url);
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
          hourlAov[hour]= 0;
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
          hourlAov[hour] = hourlyRevenue[hour] / hourlyOrders[hour];
        }
      }
    
          // Check if there is a next page
          nextPage = getNextPageLink(response.headers.link);
        }
        averageOrderValue = totalRevenue / totalOrders;
        finalProfit = totalProfit - googleAdSpend;
        h+=1;
                // Inside saveHistoricalShopifyStats, when you call saveToDB:
        await saveToDB( {
          date: dateEnddb,
          totalRevenue: totalRevenue,
          totalOrders: totalOrders,
          totalCOGS: totalCOGS,
          totalProfit: finalProfit,
          hourlyRevenue: hourlyRevenue,
          hourlyOrders: hourlyOrders,
          hourlyCOGS: hourlyCOGS,
          hourlyProfit: hourlyProfit,
          hourlyAov: hourlAov,
          averageOrderValue:averageOrderValue,
          googleAdSpend:googleAdSpend
        });

      
        
    
      } catch (error) {
        // Handle errors
        console.error('Error fetching Shopify orders:', error);
        throw error; // Re-throw the error to propagate it
      }
    }
    return { totalRevenue: totalRevenue, totalOrders: totalOrders,totalCOGS: totalCOGS, totalProfit: totalProfit, hourlyRevenue: hourlyRevenue, hourlyOrders: hourlyOrders, hourlyCOGS: hourlyCOGS, hourlyProfit: hourlyProfit , hourlAov};
      
  
    async function saveToDB(data) {
      const res = await db.collection('ShopifyStoreStats').doc(shopifyDomain).collection('dates').doc(dateEnddb).set(data);
    }
    
    
    async function getCOGS() {
      const COGSRef = db.collection('ShopifyProductCOGS').doc(shopifyDomain);
      const doc = await COGSRef.get();
      return doc.data().data
    }
    
}



function getNextPageLink(linkHeader) {
if (!linkHeader) {
    return null; // No Link header present, likely no next page
}

const linkParts = linkHeader.split(',');
const nextLink = linkParts.find(p => p.includes('rel="next"'));
if (nextLink) {
    const match = nextLink.match(/<(.*?)>; rel="next"/);
    return match ? match[1] : null;
}
return null;
}


      module.exports = saveHistoricalShopifyStats;
  