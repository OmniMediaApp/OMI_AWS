async function getAdAccountsByBID(postgres, req, res) {
    try {
        const query = `
            SELECT 
                *
            FROM 
                fb_ad_account
            WHERE 
                omni_business_id = $1
        `;

        const { omni_business_id } = req.query;
        
        const result = await postgres.query(query, [omni_business_id]);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getAdAccountsByBID:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = getAdAccountsByBID;
