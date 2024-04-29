const { Client } = require('pg');
const axios = require('axios');




// AWS RDS POSTGRESQL INSTANCE
const dbOptions = {
  user: 'postgres',
  host: 'omnirds.cluster-chcpmc0xmfre.us-east-2.rds.amazonaws.com',
  database: 'postgres',
  password: 'Omni2023!',
  port: '5432',
};

// Create a new PostgreSQL client
const client = new Client(dbOptions);

// Connect to the PostgreSQL database
client.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Connection error', err.stack));




  


  async function getAdCreatives () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
      const fields = 'adcreatives{id,authorization_category,body,branded_content,call_to_action_type,account_id,categorization_criteria,category_media_source,degrees_of_freedom_spec,effective_instagram_media_id,effective_instagram_story_id,effective_object_story_id,facebook_branded_content,image_crops,image_hash,image_url,instagram_branded_content,instagram_permalink_url,instagram_story_id,instagram_user_id,instagram_actor_id,link_url,name,object_id,object_store_url,object_type,recommender_settings,status,template_url,thumbnail_id,thumbnail_url,title,url_tags,video_id}';
      const accessToken = 'EAAMJLvHGvzkBOZCZBouUyWXYyFLoedK21YTOAd2azgGUI7Ps5t5qNITlwrv7cddAptjqlDEFSeKp8IKZAEiahsYcIi6YlNm8HRZCsr2AWF0XWIjeqZA6amIWL74L8vsJQjhZC1KU3EI1sHl3LNXlzBcE5P4DH76gDPSjkobsLJZBlbiQmU1fzfuHXXP5ONKsJNIEYm1JRn6xQAZA8GOVPJqkXjXcrTAbNrRjrZB2DE9rkOgZDZD'; // Replace with your Facebook access token
      
      const response = await axios.get(apiUrl, {
        params: {
          fields: fields,
          access_token: accessToken
        }
      })
      return response.data
    } catch(error) {
      console.error('Error fetching data:', error);
    }
  }








  async function populateAdCreatives(facebookCreativesData) {
    try {
      const query = `
        INSERT INTO fb_ad_creative 
          (ad_creative_id, ad_id, campaign_id, account_id, name, degrees_of_freedom_spec, effective_instagram_media_id, effective_object_story_id,
            instagram_permalink_url, instagram_user_id, instagram_actor_id, object_type, status, thumbnail_id, thumbnail_url, title, url_tags,
            authorization_category, body, call_to_action_type, omni_business_id) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated creative: ${facebookCreativesData.ad_creative_id} into fb_ad_creatives successfully`);
    } catch (err) {
      console.error('Insert or update error:', err.stack);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  





async function main () {
  const facebookCreativesData = await getAdCreatives()

  //console.log(facebookCreativesData)

  for (let i = 0; i < facebookCreativesData.adcreatives.data.length; i++) {
    const creativesData = {
        ad_creative_id: facebookCreativesData.adcreatives.data[i].id,
        ad_id: facebookCreativesData.adcreatives.data[i].ad_id,   //DOESNT EXIST
        campaign_id: facebookCreativesData.adcreatives.data[i].campaign_id,
        account_id: facebookCreativesData.adcreatives.data[i].account_id,
        name: facebookCreativesData.adcreatives.data[i].name,
        degrees_of_freedom_spec: facebookCreativesData.adcreatives.data[i].degrees_of_freedom_spec,
        effective_instagram_media_id: facebookCreativesData.adcreatives.data[i].effective_instagram_media_id,
        effective_object_story_id: facebookCreativesData.adcreatives.data[i].effective_object_story_id,
        instagram_permalink_url: facebookCreativesData.adcreatives.data[i].instagram_permalink_url,
        instagram_user_id: facebookCreativesData.adcreatives.data[i].instagram_user_id,
        instagram_actor_id: facebookCreativesData.adcreatives.data[i].instagram_actor_id,
        object_type: facebookCreativesData.adcreatives.data[i].object_type,
        status: facebookCreativesData.adcreatives.data[i].status,
        thumbnail_id: facebookCreativesData.adcreatives.data[i].thumbnail_id,
        thumbnail_url: facebookCreativesData.adcreatives.data[i].thumbnail_url,
        title: facebookCreativesData.adcreatives.data[i].title,
        url_tags: facebookCreativesData.adcreatives.data[i].url_tags,
        authorization_category: facebookCreativesData.adcreatives.data[i].authorization_category,
        body: facebookCreativesData.adcreatives.data[i].body,
        call_to_action_type: facebookCreativesData.adcreatives.data[i].call_to_action_type,
        omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd',
    }
    populateAdCreatives(creativesData);
  
  }
}


main();


