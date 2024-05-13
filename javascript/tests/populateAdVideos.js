require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');
const { response } = require('express');


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRateLimit(url, params, fb_adAccountID) {
    const account_id = fb_adAccountID.split('_')[1];

    const response = await axios.get(url, { params });
    const adAccountUsage = response.headers['x-business-use-case-usage'];
    if (!adAccountUsage) {
      console.error('No business use case usage data found in the headers.');
      return null;
    }
    const usageData = JSON.parse(adAccountUsage);
    if (!usageData[account_id] || usageData[account_id].length === 0) {
        console.error('Usage data is missing or does not contain expected array elements.');
        return null;
    }

    const { call_count, total_cputime, total_time, estimated_time_to_regain_access } = usageData[account_id][0];

    // Dynamically adjust waiting based on usage
    const maxUsage = Math.max(call_count, total_cputime, total_time);
    if (maxUsage >= 90) {
        console.log('API usage nearing limit. Adjusting request rate.');
        await sleep((100 - maxUsage) * 1000); // Sleep time is dynamically calculated to prevent hitting the limit
    }

    if (estimated_time_to_regain_access > 0) {
        console.log(`Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes.`);
        await sleep(estimated_time_to_regain_access * 1000); // Wait for the block to lift
    }
    if (response.status == 400){
      console.log(`Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes.`);
      await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
      console.log(response.data);
      return fetchWithRateLimit(url, params, fb_adAccountID)
  }

    return response.data;
}


  async function getMedia (fb_adAccountID,accessToken) {
   

      const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/advideos`;
      const fields = 'ad_breaks,created_time,description,embed_html,embeddable,format,id,is_instagram_eligible,length,live_status,place,post_id,post_views,privacy,published,scheduled_publish_time,source,status,title,updated_time,views,captions,event,from,icon,is_crossposting_eligible,is_crosspost_video';
       // Replace with your Facebook access token
       let allAdVideos = [];
       
       let url = apiUrl;
       let params = {
           fields: fields,
           access_token: accessToken
       };
       try {
        do {
            const response = await fetchWithRateLimit(url, params,fb_adAccountID);
            //console.log('API Response:', response); // Log the full response
            if (response && response.data) {
              allAdVideos.push(...response.data);
                nextPageUrl = response.paging.next ? response.paging.next : null; 
            } else {
                console.error('No adVideo data in response:', response);
                nextPageUrl = null; // Ensure loop exits if no further data
            }
        } while (nextPageUrl);
    } catch (error) {
        console.error('Error fetching campaigns:', error, response);
        throw error; // Rethrow the error to be handled by the calling function
    }
  
    return allAdVideos;
  }



  async function populate_fbmedia(facebookMediaData, postgres) {
    const query = `
      INSERT INTO fb_ad_videos 
        (video_id, account_id, likes, created_time, description, embed_html, embeddable, is_instagram_eligible, length, 
          post_id, title, published, updated_time, views, from_name, icon, is_crossposting_eligible, is_crosspost_video, 
          omni_business_id, performance, from_id) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (video_id) DO UPDATE SET 
        account_id = EXCLUDED.account_id,
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
        from_id = EXCLUDED.from_id
    `; // Make sure there is no trailing comma or syntax issue here
  
    try {
      const values = [
        facebookMediaData.video_id, facebookMediaData.account_id, facebookMediaData.likes, facebookMediaData.created_time, 
        facebookMediaData.description, facebookMediaData.embed_html, facebookMediaData.embeddable, facebookMediaData.is_instagram_eligible, 
        facebookMediaData.length, facebookMediaData.post_id, facebookMediaData.title, facebookMediaData.published, 
        facebookMediaData.updated_time, facebookMediaData.views, facebookMediaData.from_name, facebookMediaData.icon, 
        facebookMediaData.is_crossposting_eligible, facebookMediaData.is_crosspost_video, facebookMediaData.omni_business_id, facebookMediaData.performance, 
        facebookMediaData.from_id
      ];
  
      const result = await postgres.query(query, values);
      console.log(`Inserted or updated media: ${facebookMediaData.video_id} into fb_ad_videos successfully`);
      return result;
    } catch (err) {
      console.error('Insert or update error:', err);
    }
  };
  


  async function populate_fb_media_formats(fbMediaFormatsData, postgres) {
    try {
        const query = `
        INSERT INTO video_formats 
          (video_id, embed_html, filter, height, picture, width) 
        VALUES 
          ($1, $2, $3, $4, $5, $6)
        `;
    
      const values = [
        fbMediaFormatsData.video_id, fbMediaFormatsData.embed_html, fbMediaFormatsData.filter,
        fbMediaFormatsData.height, fbMediaFormatsData.picture, fbMediaFormatsData.width,
      ];
  
      const result = await postgres.query(query, values);
      console.log(`Inserted or updated media: ${fbMediaFormatsData.video_id} into media_formats successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  


  async function populate_fb_media_status(fbMediaStatusData, postgres) {
    try {
        const query = `
        INSERT INTO video_status 
          (video_id, video_status, uploading_status, processing_status, publishing_status) 
        VALUES 
          ($1, $2, $3, $4, $5)
        `;
    
      const values = [
        fbMediaStatusData.video_id, fbMediaStatusData.video_status, fbMediaStatusData.uploading_status,
        fbMediaStatusData.processing_status, fbMediaStatusData.publishing_status
      ];
  
      const result =  await postgres.query(query, values);
      console.log(`Inserted or updated media: ${fbMediaStatusData.video_id} into media_status successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };



  async function populate_fb_media_privacy(fbMediaPrivacyData, postgres) {
    try {
        const query = `
        INSERT INTO video_privacy 
          (video_id, allow, deny, description, friends, networks, value) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
        `;
    
      const values = [
        fbMediaPrivacyData.video_id, fbMediaPrivacyData.allow, fbMediaPrivacyData.deny,
        fbMediaPrivacyData.description, fbMediaPrivacyData.friends, fbMediaPrivacyData.networks, fbMediaPrivacyData.value
      ];
  
      const result = await postgres.query(query, values);
      console.log(`Inserted or updated media: ${fbMediaPrivacyData.video_id} into media_privacy successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };








  async function populateAdVideosMain(postgres, omniBusinessId, fb_adAccountID, accessToken) {
    const facebookMediaData = await getMedia(fb_adAccountID, accessToken);
  
    for (const advideo of facebookMediaData) {
      if (!advideo.id) {
        console.error('Missing video ID for advideo:', advideo);
        continue; // Skip this iteration if the ID is missing
      }
  
      const mediaData = {
        video_id: advideo.id,
        account_id: fb_adAccountID,
        likes: advideo.likes,
        created_time: advideo.created_time,
        description: advideo.description,
        embed_html: advideo.embed_html,
        embeddable: advideo.embeddable,
        is_instagram_eligible: advideo.is_instagram_eligible,
        length: advideo.length,
        post_id: advideo.post_id,
        title: advideo.title,
        published: advideo.published,
        updated_time: advideo.updated_time,
        views: advideo.views,
        from_name: advideo.from?.name,
        icon: advideo.icon,
        is_crossposting_eligible: advideo.is_crossposting_eligible,
        is_crosspost_video: advideo.is_crosspost_video,
        omni_business_id: omniBusinessId,
        performance: advideo.performance,
        from_id: advideo.from?.id
      };
  
      await populate_fbmedia(mediaData, postgres);
  
      if (advideo.format && Array.isArray(advideo.format)) {
        for (const format of advideo.format) {
          const fbMediaFormatData = {
            video_id: advideo.id,
            embed_html: format.embed_html,
            filter: format.filter,
            height: format.height,
            picture: format.picture,
            width: format.width
          };
          await populate_fb_media_formats(fbMediaFormatData, postgres);
        }
      }
  
      const fbMediaStatusData = {
        video_id: advideo.id,
        video_status: advideo.status.video_status,
        uploading_status: advideo.status.uploading_phase.status,
        processing_status: advideo.status.processing_phase.status,
        publishing_status: advideo.status.publishing_phase.status
      };
      await populate_fb_media_status(fbMediaStatusData, postgres);
  
      const fbMediaPrivacyData = {
        video_id: advideo.id,
        allow: advideo.privacy.allow,
        deny: advideo.privacy.deny,
        description: advideo.privacy.description,
        friends: advideo.privacy.friends,
        networks: advideo.privacy.networks,
        value: advideo.privacy.value
      };
      await populate_fb_media_privacy(fbMediaPrivacyData, postgres);
    }
  }

//populateAdMediaMain();

module.exports = populateAdVideosMain


