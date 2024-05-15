const axios = require('axios');

//const dateStart = '2024-02-09';
//const dateEnd = '2024-02-09';
//const shopifyDomain = 'instant-viral.myshopify.com';
const desiredTimezoneOffset = '-05:00'; // New York timezone offset
//const accessToken = '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';



async function getShopifyProductsFromShopify(db, req) {

  const today = new Date();
  const timeZoneOffset = -5; // New York timezone offset is UTC-5
  const utcTimestamp = today.getTime() + (today.getTimezoneOffset() * 60000);
  const adjustedTimestamp = utcTimestamp + (timeZoneOffset * 3600000);
  const adjustedDate = new Date(adjustedTimestamp);

  const dateStart = adjustedDate.toISOString().split('T')[0];
  const dateEnd = adjustedDate.toISOString().split('T')[0];

  const uid = req.query.uid;
  const limit = req.query.limit;
  const withCOGS = req.query.withCOGS;
  const withInventory = req.query.withInventory;


  async function getStoreData(uid) {
    const userRef = db.collection('users').doc(uid);
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
  console.log(uid);
  const storeData = await getStoreData(uid);
  console.log(uid);

  const shopifyDomain = storeData.shopifyDomain;
  const accessToken = storeData.shopifyAdminAccessToken



  try {



    let products = [];
    let url = `https://${shopifyDomain}/admin/api/2024-01/graphql.json`;


    while (url) {
      const config = {
        method: 'post',
        url: url,
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        data: {
          query: `
          {
            products(first: 250) {
              edges {
                node {
                  id
                  title
                  variants(first: 2) {
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
            }
          }
          
          
          
          
          `
        }
      };

      console.log(config.url);
      const response = await axios(config);
      console.log(response.data.errors)
      console.log(response.data.extensions)
      products = response?.data?.data?.products?.edges

      // Check if there is a next page
      url = getNextPageLink(response.headers.link);
    }

    return { products: products };
  } catch (error) {
    // Handle errors
    console.error('Error fetching Shopify products:', error);
    throw error; // Re-throw the error to propagate it
  }
}

function getNextPageLink(linkHeader) {
  // Implement your logic to extract the next page link from the linkHeader
  return null; // For simplicity, returning null here. You should implement this logic.
}

module.exports = getShopifyProductsFromShopify;
