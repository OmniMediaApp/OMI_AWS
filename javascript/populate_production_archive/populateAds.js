require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');

const dbOptions = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

const client = new Client(dbOptions);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to the database');
    } catch (err) {
        console.error('Database connection error', err.stack);
        process.exit(1);
    }
}

async function getAds() {
    try {
        const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
        const fields = 'ads{account_id,ad_active_time,ad_review_feedback,ad_schedule_end_time,ad_schedule_start_time,adset_id,campaign_id,configured_status,conversion_domain,created_time,creative,id,effective_status,bid_amount,last_updated_by_app_id,name,preview_shareable_link,recommendations,source_ad,source_ad_id,status,tracking_specs,updated_time,adcreatives{id}}';
        const accessToken = process.env.FB_ACCESS_TOKEN;
        
        const response = await axios.get(apiUrl, {
            params: {
                fields: fields,
                access_token: accessToken
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function populateAds(facebookAdData) {
    const query = `
        INSERT INTO fb_ad (
            ad_id, adset_id, campaign_id, account_id, name, configured_status, 
            created_time, creative, effective_status, last_updated_by_app_id,
            preview_shareable_link, source_ad, source_ad_id, status, 
            tracking_specs, ad_active_time, omni_business_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, 
            $7, $8, $9, $10, $11, 
            $12, $13, $14, $15, $16, $17
        )
        ON CONFLICT (ad_id) DO UPDATE SET
            adset_id = EXCLUDED.adset_id,
            campaign_id = EXCLUDED.campaign_id,
            account_id = EXCLUDED.account_id,
            name = EXCLUDED.name,
            configured_status = EXCLUDED.configured_status,
            created_time = EXCLUDED.created_time,
            creative = EXCLUDED.creative,
            effective_status = EXCLUDED.effective_status,
            last_updated_by_app_id = EXCLUDED.last_updated_by_app_id,
            preview_shareable_link = EXCLUDED.preview_shareable_link,
            source_ad = EXCLUDED.source_ad,
            source_ad_id = EXCLUDED.source_ad_id,
            status = EXCLUDED.status,
            tracking_specs = EXCLUDED.tracking_specs,
            ad_active_time = EXCLUDED.ad_active_time,
            omni_business_id = EXCLUDED.omni_business_id;
    `;
    const values = [
        facebookAdData.id, facebookAdData.adset_id, facebookAdData.campaign_id, "act_" + facebookAdData.account_id, 
        facebookAdData.name, facebookAdData.configured_status, facebookAdData.created_time, 
        facebookAdData.creative, facebookAdData.effective_status, facebookAdData.last_updated_by_app_id, 
        facebookAdData.preview_shareable_link, facebookAdData.source_ad, `{${facebookAdData.source_ad_id}}`, 
        facebookAdData.status, JSON.stringify(facebookAdData.tracking_specs), facebookAdData.ad_active_time, facebookAdData.omni_business_id
    ];
    try {
        await client.query(query, values);
        console.log(`Ad ${facebookAdData.id} inserted or updated successfully`);
    } catch (error) {
        console.error('Error inserting data:', error);
        if (error.message.includes("violates foreign key constraint")) {
            console.log('Skipping insertion due to missing foreign key:', error.detail);
        }
    }
}

async function main() {
    await connectToDatabase();
    try { 
        const facebookAdData = await getAds();
        if (!facebookAdData || !facebookAdData.ads) {
            throw new Error('No ads data fetched.');
        }
        for (let ad of facebookAdData.ads.data) {
            const adData = {
                id: ad.id,
                adset_id: ad.adset_id,
                campaign_id: ad.campaign_id,
                account_id: ad.account_id,
                name: ad.name,
                configured_status: ad.configured_status,
                created_time: ad.created_time,
                creative: ad.creative,
                effective_status: ad.effective_status,
                last_updated_by_app_id: ad.last_updated_by_app_id,
                preview_shareable_link: ad.preview_shareable_link,
                source_ad: ad.source_ad,
                source_ad_id: ad.source_ad_id,
                status: ad.status,
                tracking_specs: ad.tracking_specs,
                ad_active_time: ad.ad_active_time,
                omni_business_id: "b_zfPwbkxKMDfeO1s9fn5TejRILh34hd"
            };
            
            await populateAds(adData);
        }
    } catch (error) {
        console.error('Error during operation:', error);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
