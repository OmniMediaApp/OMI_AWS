const axios = require('axios');
const moment = require('moment-timezone'); // Added moment-timezone for improved date handling
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;


async function saveShopifyProductCOGS(db, req) {
    try {
        const today = moment().tz('America/New_York'); // Using moment-timezone for more accurate date handling
        const dateStart = today.format('YYYY-MM-DD');
        const dateEnd = today.format('YYYY-MM-DD');
        const uid = req.query.uid;
        const limit = req.query.limit;

        const getProducts = async (shopifyDomain, accessToken) => {
            const config = {
                method: 'get',
                url: `${shopifyDomain}/admin/api/2023-01/products.json?fields=title,id,variants&limit=250`,
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                },
            };
            const res = await axios(config);
            const productsRaw = res.data.products;
            const products = [];
            for (let i = 0; i < productsRaw.length; i++) {
                for (let j = 0; j < productsRaw[i].variants.length; j++) {
                    products.push({
                        productID: productsRaw[i].id,
                        productName: productsRaw[i].title,
                        variantTitle: productsRaw[i].variants[j].title,
                        variantID: productsRaw[i].variants[j].id,
                        inventoryID: productsRaw[i].variants[j].inventory_item_id,
                    });
                }
            }
            return products;
        };

        const getProductCost = async (shopifyDomain, accessToken, products) => {
            // Extract inventory IDs from products
            const inventoryIDs = products.map(product => product.inventoryID);
            const config = {
                method: 'get',
                url: `${shopifyDomain}/admin/api/2023-01/inventory_items.json?ids=${inventoryIDs.toString()}&limit=250`,
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                },
            };
            const res = await axios(config);
            const inventoryItems = res.data.inventory_items;
            //console.log(res.data)
            // Map inventory items to their respective products
            const productCosts = products.map(product => {
                const inventoryItem = inventoryItems.find(item => item.id === product.inventoryID);
                return {
                    productID: product.productID,
                    variantID: product.variantID,
                    productName: product.productName,
                    variantTitle: product.variantTitle,
                    inventoryID: product.inventoryID,
                    productCost: inventoryItem ? inventoryItem.cost * 1 : null, // Null if inventory item not found
                };
            });

            if (req.query.save === 'true') {
                await db.collection('ShopifyProductCOGS').doc('instant-viral.myshopify.com').set({ data: productCosts });
            }
            return productCosts;
        };

        const products = await getProducts('https://instant-viral.myshopify.com', accessToken);
        const inventoryArray = await getProductCost('https://instant-viral.myshopify.com', accessToken, products);

        return { inventoryArray };
    } catch (error) {
        console.error(error); // Log the error for debugging
        throw error; // Rethrow the error for potential higher-level handling
    }
}

module.exports = saveShopifyProductCOGS;
