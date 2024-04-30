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

async function getAdCreatives() {
    try {
        const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
        const fields = 'adcreatives{id,authorization_category,body,branded_content,call_to_action_type,account_id,categorization_criteria,category_media_source,degrees_of_freedom_spec,effective_instagram_media_id,effective_instagram_story_id,effective_object_story_id,facebook_branded_content,image_crops,image_hash,image_url,instagram_branded_content,instagram_permalink_url,instagram_story_id,instagram_user_id,instagram_actor_id,link_url,name,object_id,object_store_url,object_type,recommender_settings,status,template_url,thumbnail_id,thumbnail_url,title,url_tags,video_id}';
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
        return null;
    }
}

async function populateAdCreatives(facebookCreativesData) {
    const query = `
        INSERT INTO fb_ad_creative (
            ad_creative_id, ad_id, campaign_id, account_id, name, degrees_of_freedom_spec, effective_instagram_media_id, effective_object_story_id,
            instagram_permalink_url, instagram_user_id, instagram_actor_id, object_type, status, thumbnail_id, thumbnail_url, title, url_tags,
            authorization_category, body, call_to_action_type, omni_business_id) 
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (ad_creative_id) DO UPDATE SET
            ad_id = EXCLUDED.ad_id,
            campaign_id = EXCLUDED.campaign_id,
            account_id = EXCLUDED.account_id,
            name = EXCLUDED.name,
            degrees_of_freedom_spec = EXCLUDED.degrees_of_freedom_spec,
            effective_instagram_media_id = EXCLUDED.effective_instagram_media_id,
            effective_object_story_id = EXCLUDED.effective_object_story_id,
            instagram_permalink_url = EXCLUDED.instagram_permalink_url,
            instagram_user_id = EXCLUDED.instagram_user_id,
            instagram_actor_id = EXCLUDED.instagram_actor_id,
            object_type = EXCLUDED.object_type,
            status = EXCLUDED.status,
            thumbnail_id = EXCLUDED.thumbnail_id,
            thumbnail_url = EXCLUDED.thumbnail_url,
            title = EXCLUDED.title,
            url_tags = EXCLUDED.url_tags,
            authorization_category = EXCLUDED.authorization_category,
            body = EXCLUDED.body,
            call_to_action_type = EXCLUDED.call_to_action_type,
            omni_business_id = EXCLUDED.omni_business_id;
    `;
    const values = [
        facebookCreativesData.ad_creative_id, facebookCreativesData.ad_id, facebookCreativesData.campaign_id, facebookCreativesData.account_id,
        facebookCreativesData.name, facebookCreativesData.degrees_of_freedom_spec, facebookCreativesData.effective_instagram_media_id, facebookCreativesData.effective_object_story_id,
        facebookCreativesData.instagram_permalink_url, facebookCreativesData.instagram_user_id, facebookCreativesData.instagram_actor_id, facebookCreativesData.object_type,
        facebookCreativesData.status, facebookCreativesData.thumbnail_id, facebookCreativesData.thumbnail_url, facebookCreativesData.title,
        facebookCreativesData.url_tags, facebookCreativesData.authorization_category, facebookCreativesData.body, facebookCreativesData.call_to_action_type,
        facebookCreativesData.omni_business_id,
    ];
    try {
        await client.query(query, values);
        console.log(`Ad Creative ${facebookCreativesData.ad_creative_id} has been successfully inserted or updated.`);
    } catch (error) {
        console.error('Error inserting or updating ad creative:', error);
        console.error('Error inserting or updating ad creative:', error);
    }
}

async function main() {
    await connectToDatabase();
    const facebookCreativesData = await getAdCreatives();
    if (!facebookCreativesData || !facebookCreativesData.adcreatives || !facebookCreativesData.adcreatives.data) {
        console.error('Invalid or missing creative data');
        return;  // Exit if no data to process
    }

    for (const creative of facebookCreativesData.adcreatives.data) {
        const creativeData = {
            ad_creative_id: creative.id,
            ad_id: creative.ad_id, // Assuming ad_id is present, handle accordingly if it's not
            campaign_id: creative.campaign_id, // Same assumption as ad_id
            account_id: creative.account_id,
            name: creative.name,
            degrees_of_freedom_spec: creative.degrees_of_freedom_spec,
            effective_instagram_media_id: creative.effective_instagram_media_id,
            effective_object_story_id: creative.effective_object_story_id,
            instagram_permalink_url: creative.instagram_permalink_url,
            instagram_user_id: creative.instagram_user_id,
            instagram_actor_id: creative.instagram_actor_id,
            object_type: creative.object_type,
            status: creative.status,
            thumbnail_id: creative.thumbnail_id,
            thumbnail_url: creative.thumbnail_url,
            title: creative.title,
            url_tags: creative.url_tags,
            authorization_category: creative.authorization_category,
            body: creative.body,
            call_to_action_type: creative.call_to_action_type,
            omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd',
        };

        try {
            await populateAdCreatives(creativeData);
        } catch (error) {
            console.error(`Error inserting or updating creative ${creative.id}:`, error);
        }
    }
    await client.end();
    console.log('Database connection closed');
}

main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
