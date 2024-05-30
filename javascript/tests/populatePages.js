require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function getPages(fb_businessID, accessToken) {
    const apiUrl = `https://graph.facebook.com/v19.0/${fb_businessID}`;
    const fields = `owned_pages{name,access_token,username,verification_status,website},client_pages{name,access_token}`;
    try {
        const response = await axios.get(apiUrl, {
            params: {
                fields: fields,
                access_token: accessToken
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error.response);
        return null;
    }
}

async function populatePages(pageData, postgres) {
    const query = `
        INSERT INTO fb_pages
            (id, name, access_token, username, verification_status, website, is_client, omni_business_id) 
        VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            access_token = EXCLUDED.access_token,
            username = EXCLUDED.username,
            verification_status = EXCLUDED.verification_status,
            website = EXCLUDED.website,
            is_client = EXCLUDED.is_client,
            omni_business_id = EXCLUDED.omni_business_id;
    `;
    const values = [
        pageData.id,
        pageData.name,
        pageData.access_token,
        pageData.username,
        pageData.verification_status,
        pageData.website,
        pageData.is_client_page,
        pageData.omni_business_id
    ];

    try {
        await postgres.query(query, values);
        console.log(`Inserted or updated Business: ${pageData.id} successfully`);
    } catch (err) {
        console.error('Insert or update error:', err.stack);
    }
}

async function populatePagesMain(postgres, omniBusinessId, fb_businessID, accessToken) {
    try {
        const facebookPagesData = await getPages(fb_businessID, accessToken);

        if (!facebookPagesData) {
            console.error('Invalid business page data fetched.');
            process.exit(1);
        }

        const { owned_pages, client_pages } = facebookPagesData;

        const pages = [
            ...(owned_pages?.data || []).map(page => ({ ...page, is_client_page: false })),
            ...(client_pages?.data || []).map(page => ({ ...page, is_client_page: true }))
        ];

        for (const page of pages) {
            const pageData = {
                id: page.id,
                name: page.name,
                access_token: page.access_token || null,
                username: page.username || null,
                verification_status: page.verification_status,
                website: page.website || null,
                is_client_page: page.is_client_page,
                omni_business_id: omniBusinessId
            };

            await populatePages(pageData, postgres).catch(error => {
                console.error('Error inserting business:', error);
            });
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Example usage:
// populateBusinessesMain(postgresInstance, 'omniBusinessId', 'fb_businessID', 'accessToken');

    
module.exports = populatePagesMain;