const axios = require('axios');

async function getShopifyStats(db, postgres, req, res) {
    try {
        const omniBusinessId = req.query.omni_business_id;
        const { shopifyDomain, shopifyAdminAccessToken } = await getBusinessDetails(db, omniBusinessId);
        const productCostMap = await getCOGS(postgres, omniBusinessId);

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalProfit = 0;
    let totalCOGS = 0;
    let averageOrderValue = 0;
    let finalProfit = 0;
    let totalRefunds = 0;
    let refundCOGS = 0;
    let hourlyRevenue = Array(24).fill(0);
    let hourlyOrders = Array(24).fill(0);
    let hourlyCOGS = Array(24).fill(0);
    let hourlyProfit = Array(24).fill(0);
    let hourlyAov = Array(24).fill(0);
    
    
    let currentDate = new Date(oneMonthAgo);
  
    let h = 0; 
    while (h < 2) {
        const day = new Date(today); // Use today's date as the reference for each iteration
        day.setDate(day.getDate() - h); // Adjust for each day in the loop
        const dateFormatted = day.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dateStart = `${dateFormatted}T00:00:00-04:00`; // Adjust timezone if needed
        const dateEnd = `${dateFormatted}T23:59:59-04:00`;  // End of the day in UTC
        dateEnddb = dateFormatted;
    
        try {
            let nextPage = `https://${shopifyDomain}/admin/api/2022-10/orders.json?status=any&created_at_min=${dateStart}&created_at_max=${dateEnd}&limit=250`;
            
            console.log(dateStart);
            console.log(nextPage);

            totalRevenue = 0;
            totalOrders = 0;
            totalProfit = 0;
            totalCOGS = 0;
            averageOrderValue = 0;
            finalProfit = 0;
            totalRefunds = 0;
            hourlyRevenue = Array(24).fill(0);
            hourlyOrders = Array(24).fill(0);
            hourlyCOGS = Array(24).fill(0);
            hourlyProfit = Array(24).fill(0);
            hourlyAov = Array(24).fill(0);
            



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
             
                let orders = [];
                for (let i = 0; i < response.data.orders.length; i++) {
                    const order = response.data.orders[i];
    
                    const totalLineItemsPrice = parseFloat(order.total_line_items_price) - parseFloat(order.total_discounts);
                    const totalPrice =parseFloat(order.total_price)
                    const orderTotal = totalPrice 
                    totalRevenue += orderTotal;
                    totalOrders += 1;
                    // Calculate refunds
                    for (let refundIndex = 0; refundIndex < order.refunds.length; refundIndex++) {
                        const refund = order.refunds[refundIndex];
                        for (let refundLineItemIndex = 0; refundLineItemIndex < refund.refund_line_items.length; refundLineItemIndex++) {
                            const refundLineItem = refund.refund_line_items[refundLineItemIndex];
                            totalRefunds += parseFloat(refundLineItem.subtotal_set.presentment_money.amount);
                            console.log(refundLineItem.line_item.variant_id);
                            for (let j = 0; j < COGS.length; j++) {
                                if (refundLineItem.line_item.variant_id == COGS[j].id) {
                                    refundCOGS += parseFloat(COGS[j].cogs);
                                }
                            }
                        }
                    }
                    
                    for (let j = 0; j < order.line_items.length; j++) {
                        const lineItem = order.line_items[j];
                        orders.push({
                            variantID: lineItem.variant_id,
                            productID: lineItem.product_id,
                            quantity: lineItem.quantity,
                            orderNumber: order.order_number,
                            createdAt: order.created_at,
                            totalPrice: totalLineItemsPrice,
                        });
                    }
                }
                totalRevenue -= totalRefunds;

        await saveToDB(postgres, omniBusinessId, yesterday, totalStats, hourlyStats);

                for (let i = 0; i < allData.length; i++) {
                    totalCOGS += allData[i].productCost * allData[i].quantity;

                    const order = allData[i];
                    const orderCreatedAt = new Date(order.createdAt);
                    orderCreatedAt.setHours(orderCreatedAt.getHours() - 5);
                    const hour = orderCreatedAt.getHours();

                    hourlyRevenue[hour] += order.totalPrice;
                    hourlyCOGS[hour] += order.productCost;
                    hourlyProfit[hour] += order.profit;
                    hourlyOrders[hour] += 1;
                    hourlyAov[hour] = hourlyRevenue[hour] / hourlyOrders[hour];
                }
                
                nextPage = getNextPageLink(response.headers.link);
            }

            averageOrderValue = totalRevenue / totalOrders;
            finalProfit = totalRevenue - (totalCOGS - refundCOGS);
            
            h += 1;

            await saveToDB(postgres, omniBusinessId, dateEnddb, {
                totalRevenue: totalRevenue,
                totalOrders: totalOrders,
                totalCOGS: totalCOGS,
                totalProfit: finalProfit,
                totalRefunds: totalRefunds,
                hourlyRevenue: hourlyRevenue,
                hourlyOrders: hourlyOrders,
                hourlyCOGS: hourlyCOGS,
                hourlyProfit: hourlyProfit,
                hourlyAov: hourlyAov,
                averageOrderValue: averageOrderValue,
            });

        } catch (error) {
            console.error('Error fetching Shopify orders:', error);
            throw error;
        }
    }
    return { totalRevenue, totalOrders, totalCOGS, finalProfit, totalRefunds, refundCOGS, hourlyRevenue, hourlyOrders, hourlyCOGS, hourlyProfit, hourlyAov, dateEnddb };
}

async function getBusinessDetails(db, omniBusinessId) {
    const busRef = db.collection('businesses').doc(omniBusinessId);
    const busSnap = await busRef.get();
    if (!busSnap.exists) {
        throw new Error(`No business found for ID ${omniBusinessId}`);
    }
    return busSnap.data();
}

async function fetchShopifyOrders(shopifyDomain, shopifyAdminAccessToken, productCostMap, startDate, endDate) {
    const hourlyStats = Array(24).fill().map(() => ({
        revenue: 0,
        orders: 0,
        cogs: 0,
        profit: 0,
        discounts: 0,
    }));
    let totalStats = {
        totalRevenue: 0,
        totalOrders: 0,
        totalCOGS: 0,
        totalProfit: 0,
        totalDiscounts: 0,
    };

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateFormatted = format(currentDate, 'yyyy-MM-dd');
        const dateStart = `${dateFormatted}T00:00:00-04:00`;
        const dateEnd = `${dateFormatted}T23:59:59-04:00`;

        let nextPage = `https://${shopifyDomain}/admin/api/2022-10/orders.json?status=any&fields=total_price,discount_allocations,line_items,order_number,price_set,total_line_items_price,total_discounts,created_at&created_at_min=${dateStart}&created_at_max=${dateEnd}&limit=250`;
        while (nextPage) {
            const { orders, nextPageLink } = await fetchOrdersPage(nextPage, shopifyAdminAccessToken);
            processOrders(orders, productCostMap, hourlyStats, totalStats);
            nextPage = nextPageLink;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { totalStats, hourlyStats };
}

async function fetchOrdersPage(url, shopifyAdminAccessToken) {
    const response = await axios.get(url, {
        headers: { 'X-Shopify-Access-Token': shopifyAdminAccessToken }
    });
    return {
        orders: response.data.orders,
        nextPageLink: getNextPageLink(response.headers.link)
    };
}

function processOrders(orders, productCostMap, hourlyStats, totalStats) {
    for (const order of orders) {
        const orderRevenue = parseFloat(order.total_line_items_price) - (parseFloat(order.total_discounts || 0));
        totalStats.totalRevenue += orderRevenue;
        totalStats.totalOrders += 1;

        for (const item of order.line_items) {
            const variantID = item.variant_id;
            const itemPrice = parseFloat(item.price_set.presentment_money.amount || 0);
            const itemCOGS = parseFloat(productCostMap[variantID] || 0);
            const itemDiscount = parseFloat(item.discount_allocations[0]?.amount || 0);
            const itemProfit = itemPrice - (itemDiscount + itemCOGS);

            const orderCreatedAt = new Date(order.created_at);
            orderCreatedAt.setHours(orderCreatedAt.getHours() - 5);  // Adjust timezone if necessary
            const hour = orderCreatedAt.getHours();

            hourlyStats[hour].revenue += itemPrice - itemDiscount;
            hourlyStats[hour].orders += 1;
            hourlyStats[hour].cogs += itemCOGS;
            hourlyStats[hour].discounts += itemDiscount;
            hourlyStats[hour].profit += itemProfit;

            totalStats.totalCOGS += itemCOGS * item.quantity;
            totalStats.totalProfit += itemProfit;
            totalStats.totalDiscounts += itemDiscount;
        }
    }
}

async function saveToDB(postgres, omni_business_id, date, totalStats, hourlyStats) {
    const query = `
        INSERT INTO shopify_stats (omni_business_id, date, average_order_value, total_cost_of_goods, total_orders, total_profit, total_revenue, total_refund_amount, hourly_stats)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8  , $9)
        ON CONFLICT (omni_business_id, date) 
        DO UPDATE SET 
            average_order_value = EXCLUDED.average_order_value,
            total_cost_of_goods = EXCLUDED.total_cost_of_goods,
            total_orders = EXCLUDED.total_orders,
            total_profit = EXCLUDED.total_profit,
            total_revenue = EXCLUDED.total_revenue,
            hourly_stats = EXCLUDED.hourly_stats,
            total_refund_amount = EXCLUDED.total_refund_amount,
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
        data.totalRefunds,
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
    const query = `
        SELECT id, cogs
        FROM shopify_product_variants
        WHERE omni_business_id = $1;
    `;
    return (await postgres.query(query, [omni_business_id])).rows.reduce((map, item) => {
        map[item.id] = item.cogs;
        return map;
    }, {});
}

function getNextPageLink(linkHeader) {
    if (!linkHeader) return null;
    const linkParts = linkHeader.split(',');
    const nextLink = linkParts.find(p => p.includes('rel="next"'));
    return nextLink ? nextLink.match(/<(.*?)>; rel="next"/)[1] : null;
}

module.exports = getShopifyStats;
