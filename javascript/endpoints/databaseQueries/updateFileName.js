async function updateFileName(postgres, req, res) {
    try {
        const query = `

            UPDATE 
                file_manager
            SET 
                name = $1
            WHERE 
                id = $2;
        
        `;

        const new_name = req.query.new_name;
        const id = req.query.id;

        
        const result = await postgres.query(query, [new_name, id]);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getFileStructure:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = updateFileName;
