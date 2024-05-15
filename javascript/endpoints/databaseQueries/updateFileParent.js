async function updateFileParent(postgres, req, res) {
    try {
        const query = `

            UPDATE 
                file_manager
            SET 
                parent_id = $1,
                directory = $2
            WHERE 
                id = $3;
        
        `;

        const new_parent_id = req.query.new_parent_id;
        const new_directory = req.query.new_directory;
        const current_id = req.query.current_id;

        
        const result = await postgres.query(query, [new_parent_id, new_directory, current_id]);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getFileStructure:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = updateFileParent;
