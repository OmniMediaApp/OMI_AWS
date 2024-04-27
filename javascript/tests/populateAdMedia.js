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




  


  async function getMedia () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/1076939923394031?';
      const fields = 'ad_breaks,created_time,description,embed_html,embeddable,format,id,is_instagram_eligible,length,live_status,place,post_id,post_views,privacy,published,scheduled_publish_time,source,status,title,updated_time,views,captions,event,from,icon,is_crossposting_eligible,is_crosspost_video';
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






  async function populate_fbmedia(facebookMediaData) {
    try {
        const query = `
        INSERT INTO fb_media 
          (video_id, ad_creative_id, likes, created_time, description, embed_html, embeddable, is_instagram_eligible, length, 
            post_id, title, published, updated_time, views, from_name, icon, is_crossposting_eligible, is_crosspost_video, 
            omni_business_id, performance, from_id, video_link) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (video_id) DO UPDATE SET 
            ad_creative_id = EXCLUDED.ad_creative_id,
            likes = EXCLUDED.likes,
            created_time = EXCLUDED.created_time,
            description = EXCLUDED.description,
            embed_html = EXCLUDED.embed_html,
            embeddable = EXCLUDED.embeddable,
            is_instagram_eligible = EXCLUDED.is_instagram_eligible,
            length = EXCLUDED.length,
            post_id = EXCLUDED.post_id,
            title = EXCLUDED.title,
            published = EXCLUDED.published,
            updated_time = EXCLUDED.updated_time,
            views = EXCLUDED.views,
            from_name = EXCLUDED.from_name,
            icon = EXCLUDED.icon,
            is_crossposting_eligible = EXCLUDED.is_crossposting_eligible,
            is_crosspost_video = EXCLUDED.is_crosspost_video,
            omni_business_id = EXCLUDED.omni_business_id,
            performance = EXCLUDED.performance,
            from_id = EXCLUDED.from_id,
            video_link = EXCLUDED.video_link;
        `;


      const values = [
        facebookMediaData.video_id, facebookMediaData.ad_creative_id, facebookMediaData.likes, facebookMediaData.created_time, 
        facebookMediaData.description, facebookMediaData.embed_html, facebookMediaData.embeddable, facebookMediaData.is_instagram_eligible, 
        facebookMediaData.length, facebookMediaData.post_id, facebookMediaData.title, facebookMediaData.published, 
        facebookMediaData.updated_time, facebookMediaData.views, facebookMediaData.from_name, facebookMediaData.icon, 
        facebookMediaData.is_crossposting_eligible, facebookMediaData.is_crosspost_video, facebookMediaData.omni_business_id, facebookMediaData.performance, 
        facebookMediaData.from_id, facebookMediaData.video_link
      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated media: ${facebookMediaData.video_id} into fb_media successfully`);
      return result
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };



  async function populate_fb_media_formats(fbMediaFormatsData) {
    try {
        const query = `
        INSERT INTO media_formats 
          (video_id, embed_html, filter, height, picture, width) 
        VALUES 
          ($1, $2, $3, $4, $5, $6)
        `;
    
      const values = [
        fbMediaFormatsData.video_id, fbMediaFormatsData.embed_html, fbMediaFormatsData.filter,
        fbMediaFormatsData.height, fbMediaFormatsData.picture, fbMediaFormatsData.width,
      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated media: ${fbMediaFormatsData.video_id} into media_formats successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  


  async function populate_fb_media_status(fbMediaStatusData) {
    try {
        const query = `
        INSERT INTO media_status 
          (video_id, video_status, uploading_status, processing_status, publishing_status) 
        VALUES 
          ($1, $2, $3, $4, $5)
        `;
    
      const values = [
        fbMediaStatusData.video_id, fbMediaStatusData.video_status, fbMediaStatusData.uploading_status,
        fbMediaStatusData.processing_status, fbMediaStatusData.publishing_status
      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated media: ${fbMediaStatusData.video_id} into media_status successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };




  async function populate_fb_media_privacy(fbMediaPrivacyData) {
    try {
        const query = `
        INSERT INTO media_privacy 
          (video_id, allow, deny, description, friends, networks, value) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
        `;
    
      const values = [
        fbMediaPrivacyData.video_id, fbMediaPrivacyData.allow, fbMediaPrivacyData.deny,
        fbMediaPrivacyData.description, fbMediaPrivacyData.friends, fbMediaPrivacyData.networks, fbMediaPrivacyData.value
      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated media: ${fbMediaPrivacyData.video_id} into media_privacy successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };









async function main () {
    const facebookMediaData = await getMedia()


    //for (let i = 0; i < facebookMediaData.length; i++) {
    //for (let i = 0; i < 2; i++) {

        const match = facebookMediaData.embed_html.match(/href=([^&"]+)/);

        let video_link = '';
        if (match && match.length > 1) {
            const encodedHref = match[1]; // Extract the encoded portion of the URL
            video_link = decodeURIComponent(encodedHref); // Decode the URL
        } else {
            console.log("href attribute not found or invalid HTML string.");
        }

        const mediaData = {
            video_id: facebookMediaData.id,
            ad_creative_id: facebookMediaData.ad_creative_id,
            likes: facebookMediaData.likes,
            created_time: facebookMediaData.created_time,
            description: facebookMediaData.description,
            embed_html: facebookMediaData.embed_html,
            embeddable: facebookMediaData.embeddable,
            is_instagram_eligible: facebookMediaData.is_instagram_eligible,
            length: facebookMediaData.length,
            post_id: facebookMediaData.post_id,
            title: facebookMediaData.title,
            published: facebookMediaData.published,
            updated_time: facebookMediaData.updated_time,
            views: facebookMediaData.views,
            from_name: facebookMediaData.from_name,
            icon: facebookMediaData.icon,
            is_crossposting_eligible: facebookMediaData.is_crossposting_eligible,
            is_crosspost_video: facebookMediaData.is_crosspost_video,
            omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd',
            performance: facebookMediaData.performance,
            from_id: facebookMediaData.from_id,
            video_link: video_link,
            

    }

    await populate_fbmedia(mediaData);


    
    for (let j = 0; j < facebookMediaData.format.length; j++) {
        const fbMediaFormatData = {
            video_id: facebookMediaData.id,
            embed_html: facebookMediaData.format[j].embed_html,
            filter: facebookMediaData.format[j].filter,
            height: facebookMediaData.format[j].height,
            picture: facebookMediaData.format[j].picture,
            width: facebookMediaData.format[j].width,
        }        
        populate_fb_media_formats(fbMediaFormatData)
    }


    const fbMediaStatusData = {
        video_id: facebookMediaData.id,
        video_status: facebookMediaData.status.video_status,
        uploading_status: facebookMediaData.status.uploading_phase.status,
        processing_status: facebookMediaData.status.processing_phase.status,
        publishing_status: facebookMediaData.status.publishing_phase.status,
    }        
    populate_fb_media_status(fbMediaStatusData)
    

    const fbMediaPrivacyData = {
        video_id: facebookMediaData.id,
        allow: facebookMediaData.privacy.allow,
        deny: facebookMediaData.privacy.deny,
        description: facebookMediaData.privacy.description,
        friends: facebookMediaData.privacy.friends,
        networks: facebookMediaData.privacy.networks,
        value: facebookMediaData.privacy.value,
    }        
    populate_fb_media_privacy(fbMediaPrivacyData)
    



    
  
  //}
}


main();


