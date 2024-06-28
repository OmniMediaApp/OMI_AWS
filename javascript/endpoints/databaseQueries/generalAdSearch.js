const { Client } = require('pg');

async function generalSearch(postgres, req, res) {
    try {
        const { omni_business_id, searchString } = req.query;
        console.log({ omni_business_id, searchString });

        if (!omni_business_id || !searchString) {
            return res.status(400).json({ error: 'omni_business_id and searchString are required' });
        }

        // Define the tables to search
        const tables = [
            'fb_ad_account',
            'fb_campaign',
            'fb_adset',
            'fb_ad',
            'shopify_products'
        ];

        // Function to get all columns for a specific table
        const getColumns = async (table) => {
            const columnsQuery = `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`;
            const columnsResult = await postgres.query(columnsQuery, [table]);
            return columnsResult.rows.map(row => row.column_name);
        };

        // Function to create the search query for each table
        const createSearchQuery = (table, columns) => {
            const conditions = columns.map(column => `${column}::text ILIKE $2`).join(' OR ');
            return `SELECT * FROM ${table} WHERE omni_business_id = $1 AND (${conditions}) LIMIT 10`;
        };

        // Execute search queries for each table and combine the results
        let results = {};
        for (let table of tables) {
            const columns = await getColumns(table);
            if (columns.length === 0) {
                continue;
            }
            const query = createSearchQuery(table, columns);
            const values = [omni_business_id, `%${searchString}%`];
            const result = await postgres.query(query, values);
            results[table] = result.rows;
        }

        // Send response back to the client
        return results;
    } catch (error) {
        console.error('Error executing search query:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}

module.exports = generalSearch;
