require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');
 // Ensure axios is imported


 const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

 async function fetchWithRateLimit(url, params, fb_adAccountID) {

    const response = await axios.get(url, { params });
    //console.log("response:",response.headers)
    if (response.status == 400){

        console.log("PopulateAdSets.js: API rate limit reached. Waiting for 10 minute")
        await sleep(10 * 60 * 1000)
        return fetchWithRateLimit(url, params, fb_adAccountID)
    }
     //console.log("response:",response.data)
     return response.data;
     
 }
 
async function getAdsets(fb_adAccountID, accessToken) {
    const apiUrl = `https://graph.facebook.com/v19.0/${fb_adAccountID}/adsets`; // Correct endpoint for adsets
    const fields = 'name,id,campaign{id},budget_remaining,account_id,adset_schedule,bid_adjustments,bid_amount,bid_strategy,bid_info,campaign_id,created_time,daily_budget,daily_spend_cap,end_time,lifetime_budget,lifetime_spend_cap,recommendations,promoted_object,start_time,source_adset,source_adset_id,rf_prediction_id,review_feedback,status,targeting,updated_time';

    let allData = [];
    let url = apiUrl;
    let params = {
        fields: fields,
        access_token: accessToken,
        limit: 100
    };

    let i = 0;
    try {
        do {
          i++;
          console.log('Fetching adsets: ' + i + ' => Retreived adsets: ' + allData.length)
            const response = await fetchWithRateLimit(url, params,fb_adAccountID);
            //console.log('API Response:', response); // Log the full response
            if (response && response.data) {
                
                allData.push(...response.data); // Collect all adsets across pages
            } else {
                console.error('PopulateAdSets.js: No data field in response:', response);
                break; // Exit if no data is found
            }
            url =  response.paging?.next; // Update the URL to the next page if available
            params = {}; // Clear parameters since the next URL will contain them if needed
        } while (url);
        return allData;
    } catch (error) {
        console.error('PopulateAdSets.js: Error fetching data:', error);  // Return null to indicate failure
    }
}





  async function populate_fbadsets(facebookAdsetData, postgres) {
    try {
        const query = `
        INSERT INTO fb_adset 
          (adset_id, campaign_id, account_id, name, budget_remaining, adset_schedule, bid_adjustment, bid_amount, bid_strategy, bid_info, 
            created_time, daily_budget, daily_spend_cap, start_time, end_time, lifetime_budget, lifetime_spend_cap, recommendations, source_adset,
            source_adset_id, rf_prediction_id, review_facebook, status, updated_time, omni_business_id, db_updated_at, fb_promoted_pixel_id,
            fb_promoted_custom_event_type, targeting_age_max, targeting_age_min, targeting_geo_countries, targeting_location_types,
            targeting_brand_safety_content_filter_levels, targeting_automation) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 
            $29, $30, $31, $32, $33, $34)
        ON CONFLICT (adset_id) DO UPDATE SET 
            campaign_id = EXCLUDED.campaign_id,
            account_id = EXCLUDED.account_id,
            budget_remaining = EXCLUDED.budget_remaining,
            adset_schedule = EXCLUDED.adset_schedule,
            bid_adjustment = EXCLUDED.bid_adjustment,
            bid_amount = EXCLUDED.bid_amount,
            bid_strategy = EXCLUDED.bid_strategy,
            bid_info = EXCLUDED.bid_info,
            created_time = EXCLUDED.created_time,
            daily_budget = EXCLUDED.daily_budget,
            daily_spend_cap = EXCLUDED.daily_spend_cap,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            lifetime_budget = EXCLUDED.lifetime_budget,
            lifetime_spend_cap = EXCLUDED.lifetime_spend_cap,
            recommendations = EXCLUDED.recommendations,
            source_adset = EXCLUDED.source_adset,
            source_adset_id = EXCLUDED.source_adset_id,
            rf_prediction_id = EXCLUDED.rf_prediction_id,
            review_facebook = EXCLUDED.review_facebook,
            status = EXCLUDED.status,
            updated_time = EXCLUDED.updated_time,
            omni_business_id = EXCLUDED.omni_business_id,
            db_updated_at = EXCLUDED.db_updated_at,
            fb_promoted_pixel_id = EXCLUDED.fb_promoted_pixel_id,
            fb_promoted_custom_event_type = EXCLUDED.fb_promoted_custom_event_type,
            targeting_age_max = EXCLUDED.targeting_age_max,
            targeting_age_min = EXCLUDED.targeting_age_min,
            targeting_geo_countries = EXCLUDED.targeting_geo_countries,
            targeting_location_types = EXCLUDED.targeting_location_types,
            targeting_brand_safety_content_filter_levels = EXCLUDED.targeting_brand_safety_content_filter_levels,
            targeting_automation = EXCLUDED.targeting_automation;
        
          
        `;

      const values = [
        facebookAdsetData.adset_id, facebookAdsetData.campaign_id, facebookAdsetData.account_id, facebookAdsetData.name, 
        facebookAdsetData.budget_remaining, facebookAdsetData.adset_schedule, facebookAdsetData.bid_adjustment, facebookAdsetData.bid_amount, 
        facebookAdsetData.bid_strategy, facebookAdsetData.bid_info, facebookAdsetData.created_time, facebookAdsetData.daily_budget, 
        facebookAdsetData.daily_spend_cap, facebookAdsetData.start_time, facebookAdsetData.end_time, facebookAdsetData.lifetime_budget, 
        facebookAdsetData.lifetime_spend_cap, facebookAdsetData.recommendations, facebookAdsetData.source_adset, facebookAdsetData.source_adset_id,        
        facebookAdsetData.rf_prediction_id, facebookAdsetData.review_facebook, facebookAdsetData.status, facebookAdsetData.updated_time, 
        facebookAdsetData.omni_business_id, facebookAdsetData.db_updated_at, facebookAdsetData.fb_promoted_pixel_id, facebookAdsetData.fb_promoted_custom_event_type,
        facebookAdsetData.targeting_age_max, facebookAdsetData.targeting_age_min, facebookAdsetData.targeting_geo_countries, facebookAdsetData.targeting_location_types,
        facebookAdsetData.targeting_brand_safety_content_filter_levels, facebookAdsetData.targeting_automation

      ];
  
      const result = await postgres.query(query, values);
      console.log(`PopulateAdSets.js: Inserted or updated adset: ${facebookAdsetData.adset_id} into fb_adset successfully`);
      return result
    } catch (err) {
      console.error('PopulateAdSets.js: Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };



  async function populate_fb_adset_targeting_optimization_types(fbAdsetTargetingOptimizationTypesData, postgres) {
    try {
        const query = `
        INSERT INTO fb_targeting_optimization_types 
          (adset_id, key, value) 
        VALUES 
          ($1, $2, $3)
        `;
    
      const values = [
        fbAdsetTargetingOptimizationTypesData.adset_id, fbAdsetTargetingOptimizationTypesData.key, fbAdsetTargetingOptimizationTypesData.value
      ];
  
      const result = await postgres.query(query, values);
      console.log(`PopulateAdSets.js: Inserted or updated adset: ${fbAdsetTargetingOptimizationTypesData.adset_id} into fb_targeting_optimization_types successfully`);
    } catch (err) {
      console.error('PopulateAdSets.js: Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  


  async function populate_fb_adset_flexible_spec(fbAdsetFlexibleSpecData, postgres) {
    try {
        const query = `
        INSERT INTO fb_flexible_spec
          (adset_id, interest_id, interest_name) 
        VALUES 
          ($1, $2, $3)
        `;
    
      const values = [
        fbAdsetFlexibleSpecData.adset_id, fbAdsetFlexibleSpecData.interest_id, fbAdsetFlexibleSpecData.interest_name, 
      ];
  
      const result = await postgres.query(query, values);
      //console.log(result)
      console.log(`PopulateAdSets.js: Inserted or updated adset: ${fbAdsetFlexibleSpecData.adset_id} into fb_targeting successfully`);
    } catch (err) {
      console.error('PopulateAdSets.js: Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };









async function populateAdSetsMain (postgres, omniBusinessId, fb_adAccountID, accessToken) {


  const facebookAdsetData = await getAdsets( fb_adAccountID, accessToken);
  if (!facebookAdsetData) {
    console.error('PopulateAdSets.js: Invalid ad adset data fetched.'); // Exit early if there is no data
    return; // Add a return statement to prevent further execution
  }

    for (const adset of facebookAdsetData) {
    //for (let i = 0; i < 2; i++) {
      const adsetData = {
        // fb_adsets
        adset_id: adset.id,
        name: adset.name,
        campaign_id: adset.campaign_id,
        budget_remaining: adset.budget_remaining,
        account_id: "act_" + adset.account_id,
        adset_schedule: adset.adset_schedule,
        bid_adjustment: adset.bid_adjustment,
        bid_amount: adset.bid_amount,
        bid_strategy: adset.bid_strategy,
        bid_info: adset.bid_info,
        created_time: adset.created_time,
        daily_budget: adset.daily_budget,
        daily_spend_cap: adset.daily_spend_cap,
        end_time: adset.end_time,
        lifetime_budget: adset.lifetime_budget,
        lifetime_spend_cap: adset.lifetime_spend_cap,
        recommendations: adset.recommendations,
        start_time: adset.start_time,
        source_adset: adset.source_adset || '',
        source_adset_id: adset.source_adset_id,
        rf_prediction_id: adset.rf_prediction_id,
        review_facebook: adset.review_facebook,
        status: adset.status,
        targeting: adset.targeting,
        targeting_age_min: adset.targeting ? adset.targeting.age_min : undefined,
        targeting_age_max: adset.targeting ? adset.targeting.age_max : undefined,
        updated_time: adset.updated_time,
        omni_business_id: omniBusinessId,
        ad_ids: adset.ad_ids,
        db_updated_at: new Date(),
        pixel_id: adset.promoted_object ? adset.promoted_object.pixel_id : undefined,
        custom_event_type: adset.promoted_object ? adset.promoted_object.custom_event_type : undefined,
        age_max: adset.targeting ? adset.targeting.age_max : undefined,
        age_min: adset.targeting ? adset.targeting.age_min : undefined,
        geo_countries: adset.targeting && adset.targeting.geo_locations ? adset.targeting.geo_locations.countries : undefined,
        location_types: adset.targeting && adset.targeting.geo_locations ? adset.targeting.geo_locations.location_types : undefined,
        brand_safety_content_filter_levels: adset.targeting ? adset.targeting.brand_safety_content_filter_levels : undefined,
        targeting_automation: adset.targeting ? adset.targeting.targeting_automation : undefined,
      };
    
     
    

      await populate_fbadsets(adsetData, postgres).catch((error) => {
        console.error(`PopulateAdSets.js: Error populating adset ${adset.id}: `, error);
      });
    
    if (adset.targeting_optimization_types) {
      for (const type of adset.targeting_optimization_types) {
        const fbAdsetTargetingOptimizationTypesData = {
          adset_id: adset.id,
          key: type.key,
          value: type.value,
        };
        
        // Await the function and handle errors
        await populate_fb_adset_targeting_optimization_types(fbAdsetTargetingOptimizationTypesData, postgres).catch((error) => {
          console.error(`PopulateAdSets.js: Error populating targeting optimization types for adset ${adset.id}: `, error);
        });
      }
    }


    if (adset.targeting && adset.targeting.flexible_spec) {
      for (const spec of adset.targeting.flexible_spec) {
        if (spec.interests) {
          for (const interest of spec.interests) {
            const fbAdsetFlexibleSpecData = {
              adset_id: adset.id,
              interest_id: interest.id,
              interest_name: interest.name,
            };

            // Await the function and handle errors
            await populate_fb_adset_flexible_spec(fbAdsetFlexibleSpecData, postgres).catch((error) => {
              console.error(`PopulateAdSets.js: Error populating flexible spec for adset ${adset.id}: `, error);
            });
          }
        }
      }
    }
  }

  // Close the database connection

}



module.exports = populateAdSetsMain;