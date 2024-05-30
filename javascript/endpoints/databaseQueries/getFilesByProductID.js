async function getFilesByProductID(postgres, req, res) {
    try {
        const query = `
            SELECT 
                *
            FROM 
                file_manager
            WHERE 
                omni_business_id = $1 AND 
                product_id = $2
        `;

        const omni_business_id = req.query.omni_business_id;
        const product_id = req.query.product_id;
        
        const result = await postgres.query(query, [omni_business_id, product_id]);
        const data = result.rows;
        console.log(data)
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getFilesByProductID:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = getFilesByProductID;
