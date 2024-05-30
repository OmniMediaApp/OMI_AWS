async function getShopifyProducts(postgres, req, res) {
    try {
        const query = `
        SELECT 
            shopify_products.id as product_id,
            shopify_products.title as product_title,
            shopify_products.created_at as created_at,
            shopify_products.status as status,
            shopify_products.description as description,
            shopify_products.updated_at as updated_at,
            shopify_products.online_store_url as online_store_url,
            shopify_products.online_store_preview_url as online_store_preview_url,
            shopify_products.tags as tags,
            shopify_product_variants.display_name as variant_name,
            shopify_product_variants.inventory_id as inventory_id,
            shopify_product_variants.cogs as cogs,
            shopify_product_variants.price as price,
            shopify_product_variants.title as title,
            shopify_product_images.src as img_src
        FROM 
            shopify_products
        LEFT JOIN 
            shopify_product_variants ON shopify_products.id = shopify_product_variants.product_id
        LEFT JOIN 
            shopify_product_images ON shopify_products.id = shopify_product_images.product_id
        WHERE 
            shopify_products.omni_business_id = $1
        `;

        const omni_business_id = req.query.omni_business_id;
        
        const result = await postgres.query(query, [omni_business_id]);
        const rows = result.rows;
        
        // Organize the data into nested structure
        const nestedData = {};
        rows.forEach(row => {
            const productId = row.product_id;
            if (!nestedData[productId]) {
                nestedData[productId] = {
                    product_id: row.product_id,
                    product_title: row.product_title,
                    created_at: row.created_at,
                    status: row.status,
                    description: row.description,
                    updated_at: row.updated_at,
                    online_store_url: row.online_store_url,
                    online_store_preview_url: row.online_store_preview_url,
                    tags: row.tags,
                    variants: [],
                    images: []
                };
            }
            // Add variant to product if not already exists
            const variantExists = nestedData[productId].variants.some(variant => variant.variant_name === row.variant_name && variant.inventory_id === row.inventory_id);
            if (!variantExists) {
                nestedData[productId].variants.push({
                    variant_name: row.variant_name,
                    inventory_id: row.inventory_id,
                    cogs: row.cogs,
                    price: row.price,
                    title: row.title
                });
            }
            // Add image to product if not already exists
            if (row.img_src) {
                const imageExists = nestedData[productId].images.some(image => image.img_src === row.img_src);
                if (!imageExists) {
                    nestedData[productId].images.push({
                        img_src: row.img_src
                    });
                }
            }
        });
        
        // Convert nested data object to array of values
        const nestedArray = Object.values(nestedData);
        
        // Send response back to the client
        return nestedArray;
    } catch (error) {
        console.error('Error executing query getShopifyProducts:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = getShopifyProducts;
