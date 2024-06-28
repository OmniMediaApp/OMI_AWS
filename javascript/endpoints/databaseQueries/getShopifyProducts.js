

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
            (
                SELECT shopify_product_images.src
                FROM shopify_product_images
                WHERE shopify_product_images.product_id = shopify_products.id
                LIMIT 1
            ) as img_src
        FROM
            shopify_products
        WHERE 
            shopify_products.omni_business_id = $1
        ORDER BY
            shopify_products.title ASC;
        `;

        const omni_business_id = req.query.omni_business_id;
        
        const result = await postgres.query(query, [omni_business_id]);
        const rows = result.rows;
        
        
        
        // Send response back to the client
        return rows;
    } catch (error) {
        console.error('Error executing query getShopifyProducts:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = getShopifyProducts;
