async function updateFileFavorite(postgres, req, res) {
    try {
        const query = `

            UPDATE 
                file_manager
            SET 
                favorite = $1
            WHERE 
                id = $2;
        
        `;

        const favorite = req.query.favorite;
        const id = req.query.id;

        
        const result = await postgres.query(query, [favorite, id]);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query updateFileFavorite:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = updateFileFavorite;
