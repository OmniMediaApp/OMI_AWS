const axios = require('axios');
const { format, subDays, subMonths } = require('date-fns');

async function getShopifyStats(db, postgres, req, res) {
    try {
        const omniBusinessId = req.query.omni_business_id;
        const { shopifyDomain, shopifyAdminAccessToken } = await getBusinessDetails(db, omniBusinessId);
        const productCostMap = await getCOGS(postgres, omniBusinessId);

        const today = new Date();
        const yesterday = format(today, 'yyyy-MM-dd');
        const oneMonthAgo = format(subMonths(today, 1), 'yyyy-MM-dd');

        const { totalStats, hourlyStats } = await fetchShopifyOrders(shopifyDomain, shopifyAdminAccessToken, productCostMap, yesterday, today);

        await saveToDB(postgres, omniBusinessId, yesterday, totalStats, hourlyStats);

        res.json({
            totalRevenue: totalStats.totalRevenue,
            totalOrders: totalStats.totalOrders,
            totalCOGS: totalStats.totalCOGS,
            totalProfit: totalStats.totalProfit,
            hourlyStats,
            dateEnddb: yesterday
        });
    } catch (error) {
        console.error('Error fetching Shopify orders:', error);
        res.status(500).json({ error: 'Error fetching Shopify orders' });
    }
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
        totalStats.totalRevenue / totalStats.totalOrders,
        totalStats.totalCOGS,
        totalStats.totalOrders,
        totalStats.totalProfit,
        totalStats.totalRevenue,
        JSON.stringify(hourlyStats.map(h => ({
            revenue: h.revenue,
            orders: h.orders,
            cogs: h.cogs,
            profit: h.profit,
            discounts: h.discounts,
            aov: h.revenue / h.orders || 0
        })))
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
