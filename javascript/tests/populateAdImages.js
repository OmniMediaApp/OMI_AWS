require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRateLimit(url, params, fb_adAccountID, retryCount = 0, maxRetries = 3) {
  const account_id = fb_adAccountID.split('_')[1];

  try {
      const response = await axios.get(url, { params });
      const adAccountUsage = response.headers['x-business-use-case-usage'];

      if (!adAccountUsage) {
          console.error('PopulateAdVideos.js: No business use case usage data found in the headers.');
          return null;
      }

      const usageData = JSON.parse(adAccountUsage);

      if (!usageData[account_id] || usageData[account_id].length === 0) {
          console.error('PopulateAdVideos.js: Usage data is missing or does not contain expected array elements.');
          return null;
      }

      const { call_count, total_cputime, total_time, estimated_time_to_regain_access } = usageData[account_id][0];

      // Dynamically adjust waiting based on usage
      const maxUsage = Math.max(call_count, total_cputime, total_time);
      console.log(`PopulateAdVideos.js: API USAGE ${maxUsage}%`);

      if (response.status == 400 || response.status == 500) {
          if (retryCount < maxRetries) {
              console.log(`PopulateAdVideos.js: Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
              await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
              return fetchWithRateLimit(url, params, fb_adAccountID, retryCount + 1, maxRetries);
          } else {
              console.log(`PopulateAdVideos.js: Failed after ${maxRetries} retries.`);
              throw new Error(`Failed after ${maxRetries} retries.`);
          }
      } else {
          return response.data;
      }
  } catch (error) {
      if (error.response && (error.response.status == 400 || error.response.status == 500)) {
          if (retryCount < maxRetries) {
              const adAccountUsage = error.response.headers['x-business-use-case-usage'];
              if (!adAccountUsage) {
                  console.error('PopulateAdVideos.js: No business use case usage data found in the headers.');
                  throw error;
              }
              const usageData = JSON.parse(adAccountUsage);
              if (!usageData[account_id] || usageData[account_id].length === 0) {
                  console.error('PopulateAdVideos.js: Usage data is missing or does not contain expected array elements.');
                  throw error;
              }
              const { estimated_time_to_regain_access } = usageData[account_id][0];

              console.log(`PopulateAdVideos.js: Access is temporarily blocked. Waiting for ${estimated_time_to_regain_access} minutes. Retrying (${retryCount + 1}/${maxRetries})...`);
              await sleep((estimated_time_to_regain_access + 1) * 1000 * 60);
              return fetchWithRateLimit(url, params, fb_adAccountID, retryCount + 1, maxRetries);
          } else {
              console.log(`PopulateAdVideos.js: Failed after ${maxRetries} retries.`);
              throw new Error(`Failed after ${maxRetries} retries.`);
          }
      } else {
          console.log(`PopulateAdVideos.js: Encountered unexpected error.`, error);
          throw error;
      }
  }
}

async function getImages(fb_adAccountID, accessToken) {
  const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/adimages`;
  const fields = 'created_time,id,status,updated_time,creatives,hash,height,is_associated_creatives_in_adgroups,name,original_height,original_width,permalink_url,url,url_128,width,account_id';
  
  let allAdImages = [];
  let url = apiUrl;
  let params = {
      fields: fields,
      access_token: accessToken,
      limit: 100
  };
  
  try {
      let nextPageUrl = null;
      let i = 0;
      
      do {
          i++;
          console.log('Fetching videos: ' + i + ' => Retrieved images: ' + allAdImages.length);
          
          const response = await fetchWithRateLimit(url, params, fb_adAccountID);
          
          if (response && response.data) {
              allAdImages.push(...response.data);
          } else {
              console.error('No images data in response:', response);
              nextPageUrl = null;
          }
          url = response.paging?.next;
          params = {};
      } while (url);
  } catch (error) {
      console.error('Error fetching images:', error.message);
      throw error; // Rethrow the error to be handled by the calling function
  }
  return allAdImages;
}

async function populate_fbImages(facebookImageData, postgres, omniBusinessId, fb_adAccountID) {
  const query = `
    INSERT INTO fb_ad_images 
      (image_id, account_id, hash, name, creatives, status, created_time, updated_time, is_associated_creatives_in_adgroups, height, width, original_height, original_width, permalink_url, url, url_128, omni_business_id) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT (image_id) DO UPDATE SET 
      name = excluded.name,
      creatives = excluded.creatives,
      status = excluded.status,
      created_time = excluded.created_time,
      updated_time = excluded.updated_time,
      is_associated_creatives_in_adgroups = excluded.is_associated_creatives_in_adgroups,
      height = excluded.height,
      width = excluded.width,
      original_height = excluded.original_height,
      original_width = excluded.original_width,
      permalink_url = excluded.permalink_url,
      url = excluded.url,
      url_128 = excluded.url_128,
      omni_business_id = excluded.omni_business_id; 
  `;

  try {
    const values = [
      facebookImageData.id, fb_adAccountID, facebookImageData.hash, facebookImageData.name, 
      facebookImageData.creatives, facebookImageData.status, 
      facebookImageData.created_time, facebookImageData.updated_time,
      facebookImageData.is_associated_creatives_in_adgroups, facebookImageData.height, facebookImageData.width,
      facebookImageData.original_height, facebookImageData.original_width, facebookImageData.permalink_url,
      facebookImageData.url, facebookImageData.url_128, omniBusinessId
    ];

    const result = await postgres.query(query, values);
    console.log(`PopulateAdImages.js: Inserted or updated images: ${facebookImageData.id} into fb_ad_images successfully`);
    return result;
  } catch (err) {
    console.error('PopulateAdImages.js: Insert or update error:', err);
  }
};

async function populateAdImagesMain(postgres, omniBusinessId, fb_adAccountID, accessToken) {
  try {
    const facebookMediaData = await getImages(fb_adAccountID, accessToken);

    for (const adImages of facebookMediaData) {
      if (!adImages.id) {
        console.error('PopulateAdVideos.js: Missing image ID for adImages:', adImages);
        continue; // Skip this iteration if the ID is missing
      }

      await populate_fbImages(adImages, postgres, omniBusinessId, fb_adAccountID);
    }
  } catch (error) {
    console.error('Error in fetching adImages in main:', error);
    throw error; // Re-throw the error to propagate it
  }
}

module.exports = populateAdImagesMain;
