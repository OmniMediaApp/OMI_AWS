async function getFileStructure(postgres, req, res) {
    try {
        const query = `
            SELECT 
                *
            FROM 
                file_manager
            WHERE 
                omni_business_id = $1 AND 
                parent_id = $2
        `;

        const omni_business_id = req.query.omni_business_id;
        const parent_id = req.query.parent_id;
        
        const result = await postgres.query(query, [omni_business_id, parent_id]);
        const data = result.rows;
        //console.log(data)
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getFileStructure:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = getFileStructure;
