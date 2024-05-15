async function updateFileProductID(postgres, req, res) {
    try {
        const query = `

            UPDATE 
                file_manager
            SET 
                product_id = $1
            WHERE 
                id = $3;
        
        `;

        const new_product_id = req.query.new_product_id;
        const id = req.query.id;

        
        const result = await postgres.query(query, [new_product_id, id]);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getFileStructure:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = updateFileProductID;
