async function getShopifyProduct(postgres, product_id) {
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
            shopify_products.id = $1
        `;
        
        const result = await postgres.query(query, [product_id]);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getShopifyProduct:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = getShopifyProduct;
