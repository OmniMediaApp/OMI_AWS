async function getShopifyProductImages(postgres, req, res) {
    try {
        const product_id = req.query.product_id;

        const query = `
        SELECT
            *
        FROM
            shopify_product_images
        WHERE 
            shopify_product_images.product_id = $1;
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

module.exports = getShopifyProductImages;
