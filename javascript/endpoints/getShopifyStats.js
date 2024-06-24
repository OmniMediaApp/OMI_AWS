const axios = require('axios');



// Placeholder function for getCOGS - you will need to implement this based on your application logic

async function getShopifyStats(db, postgres, req, res) {
    const omniBusinessId = req.query.omni_business_id;
    
    const busRef = db.collection('businesses').doc(omniBusinessId);
    const busSnap = await busRef.get();
    const shopifyDomain = busSnap.data().shopifyDomain;
    const accessToken = busSnap.data().shopifyAdminAccessToken;
    const today = new Date(); // Starting point is today
    const oneYearAgo = new Date();
    const oneMonthAgo = new Date();
    
    oneYearAgo.setFullYear(today.getFullYear() - 1); // Set to one year ago from today
    oneMonthAgo.setMonth(today.getMonth() - 1);
    let dateEnddb;

    let totalRevenue;
    let totalOrders;
    let totalProfit;
    let totalCOGS;
    let averageOrderValue;
    let finalProfit;
    let hourlyRevenue = Array(24).fill(0);
    let hourlyOrders = Array(24).fill(0);
    let hourlyCOGS = Array(24).fill(0);
    let hourlyProfit = Array(24).fill(0);
    let hourlAov = Array(24).fill(0);
    
    let currentDate = new Date(oneMonthAgo);
  
    let h = 0; 
    while (h < 1) {
        const day = new Date(today); // Use today's date as the reference for each iteration
        day.setDate(day.getDate() - h); // Adjust for each day in the loop
        const dateFormatted = day.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dateStart = `${dateFormatted}T00:00:00-04:00`; // Adjust timezone if needed
        const dateEnd = `${dateFormatted}T23:59:59-04:00`;  // End of the day in UTC
        dateEnddb = dateFormatted;
    
        try {
            let nextPage = `https://${shopifyDomain}/admin/api/2022-10/orders.json?status=any&fields=total_price,line_items,order_number,created_at,financial_status&created_at_min=${dateStart}&created_at_max=${dateEnd}&limit=${250}`;
            
            console.log(dateStart);

            totalRevenue = 0;
            totalOrders = 0;
            totalProfit = 0; 
            totalCOGS = 0;
            finalProfit = 0;
            averageOrderValue = 0;
            
            console.log(nextPage);
            while (nextPage) {
                const config = {
                    method: 'get',
                    url: nextPage,
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                    },
                };
                
                const response = await axios(config);
                const productCost = await getCOGS(postgres, omniBusinessId);
                const COGS = productCost.filter(item => item.cogs !== null);
                // console.log(COGS);
             
                let orders = [];
                let debugtotal = 0;
                let debugsum = 0;
                for (let i = 0; i < response.data.orders.length; i++) {
                    for (let j = 0; j < response.data.orders[i].line_items.length; j++) {
                        orders.push({
                            variantID: response.data.orders[i].line_items[j].variant_id,
                            productID: response.data.orders[i].line_items[j].product_id,
                            quantity: response.data.orders[i].line_items[j].quantity,
                            orderNumber: response.data.orders[i].order_number,
                            createdAt: response.data.orders[i].created_at,
                            totalPrice: parseFloat(response.data.orders[i].line_items[j].price_set.presentment_money.amount),
                        });
                        console.log("debug",response.data.orders[i].line_items[j].price_set.presentment_money.amount * 1);
                        debugtotal = response.data.orders[i].line_items[j].price_set.presentment_money.amount * 1;
                        debugsum = debugtotal + debugsum;
                        // console.log("debug",debugtotal);
                    }
                }
                 console.log("summm",debugsum);
                // console.log("debug",debugtotal);

                let allData = [];
                for (let i = 0; i < orders.length; i++) {
                    for (let j = 0; j < COGS.length; j++) {
                        if (orders[i].variantID == COGS[j].id) {
                            let orderProfit = orders[i].totalPrice - parseFloat(COGS[j].cogs);
                            totalProfit += orderProfit;
                            allData.push({
                                createdAt: orders[i].createdAt,
                                totalPrice: orders[i].totalPrice,
                                orderNumber: orders[i].orderNumber,
                                productID: orders[i].productID,
                                productCost: parseFloat(COGS[j].cogs),
                                profit: orderProfit,
                                quantity: orders[i].quantity,
                            });
                        }
                    }
                }

                for (let i = 0; i < allData.length; i++) {
                    totalRevenue += allData[i].totalPrice;
                    totalOrders += 1;
                    totalCOGS += allData[i].productCost * allData[i].quantity;

                    const order = allData[i];
                    const orderCreatedAt = new Date(order.createdAt);
                    orderCreatedAt.setHours(orderCreatedAt.getHours() - 5);
                    const hour = orderCreatedAt.getHours();

                    hourlyRevenue[hour] += order.totalPrice;
                    hourlyCOGS[hour] += order.productCost;
                    hourlyProfit[hour] += order.profit;
                    hourlyOrders[hour] += 1;
                    hourlAov[hour] = hourlyRevenue[hour] / hourlyOrders[hour];
                }
                
                nextPage = getNextPageLink(response.headers.link);
            }

            averageOrderValue = totalRevenue / totalOrders;
            finalProfit = totalProfit;
            
            h += 1;

            await saveToDB(postgres, omniBusinessId, dateEnddb, {
                totalRevenue: totalRevenue,
                totalOrders: totalOrders,
                totalCOGS: totalCOGS,
                totalProfit: finalProfit,
                hourlyRevenue: hourlyRevenue,
                hourlyOrders: hourlyOrders,
                hourlyCOGS: hourlyCOGS,
                hourlyProfit: hourlyProfit,
                hourlyAov: hourlAov,
                averageOrderValue: averageOrderValue,
            });
            

        } catch (error) {
            console.error('Error fetching Shopify orders:', error);
            throw error;
        }
    }
    return { totalRevenue, totalOrders, totalCOGS, totalProfit, hourlyRevenue, hourlyOrders, hourlyCOGS, hourlyProfit, hourlAov, dateEnddb };
}

async function saveToDB(postgres, omni_business_id, date, data) {
    const query = `
        INSERT INTO shopify_stats (omni_business_id, date, average_order_value, total_cost_of_goods, total_orders, total_profit, total_revenue, hourly_stats)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (omni_business_id, date) 
        DO UPDATE SET 
            average_order_value = EXCLUDED.average_order_value,
            total_cost_of_goods = EXCLUDED.total_cost_of_goods,
            total_orders = EXCLUDED.total_orders,
            total_profit = EXCLUDED.total_profit,
            total_revenue = EXCLUDED.total_revenue,
            hourly_stats = EXCLUDED.hourly_stats,
            updated_at = CURRENT_TIMESTAMP;
    `;

    const values = [
        omni_business_id, 
        date, 
        data.averageOrderValue, 
        data.totalCOGS, 
        data.totalOrders, 
        data.totalProfit, 
        data.totalRevenue, 
        JSON.stringify({
            hourlyRevenue: data.hourlyRevenue,
            hourlyOrders: data.hourlyOrders,
            hourlyCOGS: data.hourlyCOGS,
            hourlyProfit: data.hourlyProfit,
            hourlyAov: data.hourlyAov,
        })
    ];

    await postgres.query(query, values);
}

async function getCOGS(postgres, omni_business_id) {
    // Implement this function based on your application logic
    
    const query = `
        SELECT id, cogs
        FROM shopify_product_variants
        WHERE omni_business_id = $1;
    `;

    return (await postgres.query(query, [omni_business_id])).rows;
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

module.exports = getShopifyStats;
