const axios = require('axios');


const desiredTimezoneOffset = '-05:00'; // New York timezone offset


async function updateShopifyPorductsMain (db, postgres, omnibusinessID, productID) {
    try {
        console.log('populating shopify products main running')
        const omni_business_id = omnibusinessID;
        const products = await getShopifyProductById(db,omnibusinessID, productID)
        console.log('shopify products received')


        for (let i = 0; i < products.length; i++) {
            await populateShopifyProducts(postgres, products[i], omni_business_id);
            for (let j = 0; j < products[i].variants.edges.length; j++) {
                await populateShopifyProductVariants(postgres, products[i].variants.edges[j].node, (products[i].id).split('/').pop(), omni_business_id);
            }
            for (let k = 0; k < products[i].images.nodes.length; k++) {
                await populateShopifyProductImages(postgres, products[i].images.nodes[k], (products[i].id).split('/').pop(), omni_business_id);
            }
        }
    } catch (error) {
        console.log("populateShopifyProducts.js: ERROR main file", error)
    }
}




async function populateShopifyProducts (postgres, product, omni_business_id) {
    const query = `
    INSERT INTO shopify_products
        (id, title, created_at, status, tags, online_store_url, online_store_preview_url, updated_at, description, omni_business_id) 
    VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        created_at = EXCLUDED.created_at,
        status = EXCLUDED.status,
        tags = EXCLUDED.tags,
        online_store_url = EXCLUDED.online_store_url,
        online_store_preview_url = EXCLUDED.online_store_preview_url,
        updated_at = EXCLUDED.updated_at,
        description = EXCLUDED.description,
        omni_business_id = EXCLUDED.omni_business_id;

    `;

    const values = [
        product.id.split('/').pop(),
        product.title,
        product.createdAt,
        product.status,
        product.tags,
        product.onlineStoreUrl,
        product.onlineStorePreviewUrl,
        product.updatedAt,
        product.description,
        omni_business_id,
    ];

    try {
        await postgres.query(query, values);
        console.log(`Inserted or updated Product: ${product.id} successfully`);
    } catch (error) {
        console.log("populateShopifyProducts.js: ERROR populating shopify products", error)
    }
}



async function populateShopifyProductVariants (postgres, variant, productID, omni_business_id) {
    const query = `
    INSERT INTO shopify_product_variants
        (id, product_id, display_name, title, inventory_id, cogs, price, omni_business_id) 
    VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET 
        product_id = EXCLUDED.product_id,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title,
        inventory_id = EXCLUDED.inventory_id,
        cogs = EXCLUDED.cogs,
        price = EXCLUDED.price,
        omni_business_id = EXCLUDED.omni_business_id;
    `;

    const values = [
        (variant.id).split('/').pop(),
        productID,
        variant.displayName,
        variant.title,
        (variant.inventoryItem.id).split('/').pop(),
        variant.inventoryItem.unitCost?.amount,
        variant.price,
        omni_business_id,
    ];

    try {
        await postgres.query(query, values);
        console.log(`Inserted or updated Variant: ${variant.id} successfully`);
    } catch (error) {
        console.log("populateShopifyProducts.js: ERROR populating shopify variant", error)
    }
}




async function populateShopifyProductImages (postgres, image, productID, omni_business_id) {
    const query = `
    INSERT INTO shopify_product_images
        (product_id, src, omni_business_id) 
    VALUES 
        ($1, $2, $3)
    ON CONFLICT (src) DO UPDATE SET 
        product_id = EXCLUDED.product_id,
        omni_business_id = EXCLUDED.omni_business_id;
    `;

    const values = [
        productID,
        image.src,
        omni_business_id,
    ];

    try {
        await postgres.query(query, values);
        console.log(`Inserted or updated Image: ${image.src} successfully`);
    } catch (error) {
        console.log("populateShopifyProducts.js: ERROR populating shopify variant", error)
    }
}

async function getShopifyProductById(db, omnibusinessID, productID) {
    try {

      const storeData = await getStoreData(db, omnibusinessID);
      const shopifyDomain = storeData.shopifyDomain;
      const accessToken = storeData.shopifyAdminAccessToken;
  
      const query = `
        {
          product(id: "${productID}") {
            id
            title
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  inventoryQuantity
                  displayName
                  inventoryItem {
                    id
                    unitCost {
                      amount
                    }
                    locationsCount
                    inventoryLevels(first: 10) {
                      edges {
                        node {
                          id
                          available
                          location {
                            id
                          }
                        }
                      }
                    }
                  }
                  price
                }
              }
            }
            createdAt
            status
            tags
            onlineStoreUrl
            onlineStorePreviewUrl
            totalInventory
            updatedAt
            images(first: 10) {
              nodes {
                src
              }
            }
            priceRange {
              maxVariantPrice {
                amount
              }
              minVariantPrice {
                amount
              }
            }
            descriptionHtml
            description
          }
        }
      `;
  
      const config = {
        method: 'post',
        url: `https://${shopifyDomain}/admin/api/2024-01/graphql.json`,
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        data: { query }
      };
  
      const response = await axios(config);
      const data = response.data.data;
  
      if (data && data.product) {
        return data.product;
      } else {
        return 'Product not found';
      }
    } catch (error) {
      console.error('Error fetching Shopify product:', error);
      throw error; // Re-throw the error to propagate it
    }
  }
  
  
  
  
  
  async function getStoreData(db, omnibusinessID) {
    try {
        const businessRef = db.collection('businesses').doc(omnibusinessID);
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
    
    }catch (error) {
            console.error('Error fetching store data:', error);
            throw error; // Re-throw the error to propagate it
            }
      }
    




module.exports = updateShopifyPorductsMain;
