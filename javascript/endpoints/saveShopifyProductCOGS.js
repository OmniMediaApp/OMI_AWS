const axios = require('axios');
const moment = require('moment-timezone'); // Added moment-timezone for improved date handling
//const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;


async function saveShopifyProductCOGS(db, req, postgres) {

    const uid = req.query.uid;


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
              shopifyDomain: 'https://' + businessDoc.data().shopifyDomain,
              facebookAccessToken: businessDoc.data().facebookAccessToken,
              omniBusinessID: userDoc.data().businessID
            }
          }
        }
      }

    const storeData = await getStoreData(uid);
    const shopifyAccessToken = storeData.shopifyAdminAccessToken;
    const shopifyDomain = storeData.shopifyDomain;
    const omniBusinessID = storeData.omniBusinessID;

    console.log(shopifyDomain)

    try {
        const today = moment().tz('America/New_York'); // Using moment-timezone for more accurate date handling
        const dateStart = today.format('YYYY-MM-DD');
        const dateEnd = today.format('YYYY-MM-DD');
        const uid = req.query.uid;
        const limit = req.query.limit;



        async function saveToPostgres(postgres, shopifyProductInfo) {
            const query = `
              INSERT INTO shopify_products
                (inventory_id, product_cost, product_id, product_name, variant_id, variant_title, omni_business_id) 
              VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (inventory_id) DO UPDATE SET
                product_cost = EXCLUDED.product_cost,
                product_id = EXCLUDED.product_id,
                product_name = EXCLUDED.product_name,
                variant_id = EXCLUDED.variant_id,
                variant_title = EXCLUDED.variant_title,
                omni_business_id = EXCLUDED.omni_business_id;
            `;
            const values = [
                shopifyProductInfo.inventory_id, shopifyProductInfo.product_cost, shopifyProductInfo.product_id, shopifyProductInfo.product_name, 
                shopifyProductInfo.variant_id, shopifyProductInfo.variant_title, shopifyProductInfo.omni_business_id
            ];
          
            try {
              await postgres.query(query, values);
              console.log(`Inserted or updated shopify Inventory ID: ${shopifyProductInfo.inventory_id} successfully`);
            } catch (err) {
              console.error('Insert or update error:', err.stack);
              process.exit(1);
            }
          }




        async function getProducts (shopifyDomain, accessToken) {
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
            //console.log(products)
            console.log(products.length)
            return products;
        };

        async function getProductCost(shopifyDomain, accessToken, products) {
            // Extract inventory IDs from products
            const inventoryIDs = products.map(product => product.inventoryID);
        
            // Split inventoryIDs into chunks of 100 or fewer IDs
            const chunkedInventoryIDs = [];
            for (let i = 0; i < inventoryIDs.length; i += 100) {
                chunkedInventoryIDs.push(inventoryIDs.slice(i, i + 100));
            }
        
            // Array to store results from all requests
            const productCosts = [];
        
            let i = 0
            // Make separate requests for each chunk
            for (const chunk of chunkedInventoryIDs) {
                i++
                console.log(i)
                const config = {
                    method: 'get',
                    url: `${shopifyDomain}/admin/api/2023-01/inventory_items.json?ids=${chunk.toString()}&limit=250`,
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                    },
                };
                const res = await axios(config);
                const inventoryItems = res.data.inventory_items;
        
                // Map inventory items to their respective products
                // const chunkProductCosts = products.map(product => {
                //     const inventoryItem = inventoryItems.find(item => item.id === product.inventoryID); 
                    
                const chunkProductCosts = inventoryItems.map(inventoryItem => {
                    const product = products.find(item => item.inventoryID === inventoryItem.id);
                    return {
                        product_id: product.productID,
                        variant_id: product.variantID,
                        product_name: product.productName,
                        variant_title: product.variantTitle,
                        inventory_id: product.inventoryID,
                        product_cost: inventoryItem ? inventoryItem.cost * 1 : null, // Null if inventory item not found
                        omni_business_id: omniBusinessID 
                    };
                });
        
                productCosts.push(...chunkProductCosts);
            }
        
            if (req.query.save === 'true') {
                for (let i = 0; i < productCosts.length; i++) {
                    await saveToPostgres(postgres, productCosts[i])
                    console.log("Saved Product to DB", i)
                }
                //await db.collection('ShopifyProductCOGS').doc(shopifyDomain.slice(8,100)).set({ data: productCosts });
            }
            return productCosts;
        };
        

        const products = await getProducts(shopifyDomain, shopifyAccessToken);
        const inventoryArray = await getProductCost(shopifyDomain, shopifyAccessToken, products);

        return { inventoryArray };
    } catch (error) {
        console.error(error); // Log the error for debugging
        throw error; // Rethrow the error for potential higher-level handling
    }
}
 
module.exports = saveShopifyProductCOGS;
