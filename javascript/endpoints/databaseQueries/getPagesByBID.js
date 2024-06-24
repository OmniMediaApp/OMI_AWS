

async function getPagesByBID(postgres, req, res) {
    try {
        const query = `
            SELECT * FROM public.fb_pages
            WHERE omni_business_id = $1
        `;

        const { omni_business_id } = req.query;
        
        const result = await postgres.query(query, [omni_business_id]);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query getPagesByBID:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = getPagesByBID;
