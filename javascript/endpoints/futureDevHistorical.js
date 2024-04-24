const axios = require('axios');

const shopifyDomain = 'instant-viral.myshopify.com';
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN

// Placeholder function for getCOGS - you will need to implement this based on your application logic
async function getCOGS(productID) {
  // Your logic to fetch COGS for a product by its ID
  // Returning a dummy value for demonstration
  return 10;
}

async function saveHistoricalShopifyStats() {
  const today = new Date();
  today.setDate(today.getDate() - 1);

  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  let totalRevenue = 0;
  let totalOrders = 0;
  let totalProfit = 0;
  let totalCOGS = 0;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let day = oneYearAgo; day <= today; day.setDate(day.getDate() + 1)) {
    const dateString = day.toISOString().split('T')[0];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const query = `
        query {
          orders(query: "created_at:>'${dateString}' AND created_at:<'${dateString}T23:59:59'", first: 10${cursor ? `, after: "${cursor}"` : ''}) {
            edges {
              cursor
              node {
                id
                name
                createdAt
                totalPriceSet {
                  presentmentMoney {
                    amount
                  }
                }
                lineItems(first: 250) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      variant {
                        id
                        price
                        product {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      try {
        const response = await axios({
          url: `https://${shopifyDomain}/admin/api/2022-01/graphql.json`,
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({ query })
        });

        // Extract orders from the response
        const ordersEdges = response.data.data.orders.edges || [];

        for (const lineItemEdge of order.lineItems.edges) {
          const lineItem = lineItemEdge.node;
          // Ensure variant and product exist before accessing product.id
          if (lineItem.variant && lineItem.variant.product) {
            const productCOGS = await getCOGS(lineItem.variant.product.id);
            const lineItemProfit = (parseFloat(lineItem.variant.price) - productCOGS) * lineItem.quantity;
        
            totalProfit += lineItemProfit;
            totalCOGS += productCOGS * lineItem.quantity;
          } else {
            // Handle the case where variant or product is null
            console.error(`Missing variant or product for line item in order ${order.name}`);
            // Consider logging this case or handling it according to your application's needs
          }
        }
        

        hasNextPage = response.data.data.orders.pageInfo.hasNextPage;
        cursor = ordersEdges.length > 0 ? ordersEdges[ordersEdges.length - 1].cursor : null;

        await sleep(300); // Sleep to avoid hitting rate limits
      } catch (error) {
        console.error(`Error fetching data for ${dateString}:`, error);
        hasNextPage = false; // Exit loop on error
      }
    }

    // Reset variables for the next day
    cursor = null;
    day = new Date(day.setDate(day.getDate() + 1));
  }

  // Here, you could save the accumulated totals to your database
  console.log('Total Orders:', totalOrders);
  console.log('Total Revenue:', totalRevenue);
  console.log('Total Profit:', totalProfit);
  console.log('Total COGS:', totalCOGS);
}


