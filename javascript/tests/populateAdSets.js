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




  


  async function getAdsets () {
    try {
      const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
      const fields = 'account_id,adsets{name,id,campaign,budget_remaining,account_id,adset_schedule,bid_adjustments,bid_amount,bid_strategy,bid_info,campaign_id,created_time,daily_budget,daily_spend_cap,end_time,lifetime_budget,lifetime_spend_cap,recommendations,promoted_object,start_time,source_adset,source_adset_id,rf_prediction_id,review_feedback,status,targeting,targeting_optimization_types,updated_time}';
      const accessToken = 'EAAMJLvHGvzkBO5WXFaVRKoJ78NHa0BTajblL6P3YXacZB5QvTrWKDAm1Vg8AoTyOW1EAGowebjr6LJ2pM90rDoGZA3OY02cHtjigaZBzbDxLPgdsLIlZAnyp6JDvQzBZBuKNki3IYkRL9fnEr2ks6mZBBLvsV3jJ7q05LqZCmXERZCgMijiEGTPVZBwVGunq775sS14eetq1vGhZAMVG5SKXrFQ74x8KRhthZCPL0UZCsUQZCoVkZD'; // Replace with your Facebook access token
      
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






  async function populate_fbadsets(facebookAdsetData) {
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
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated adset: ${facebookAdsetData.adset_id} into fb_adset successfully`);
      return result
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };



  async function populate_fb_adset_targeting_optimization_types(fbAdsetTargetingOptimizationTypesData) {
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
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated adset: ${fbAdsetTargetingOptimizationTypesData.adset_id} into fb_targeting_optimization_types successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  


  async function populate_fb_adset_flexible_spec(fbAdsetFlexibleSpecData) {
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
  
      const result = await client.query(query, values);
      //console.log(result)
      console.log(`Inserted or updated adset: ${fbAdsetFlexibleSpecData.adset_id} into fb_targeting successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };









async function main () {
    const facebookAdsetData = await getAdsets()


    for (let i = 0; i < facebookAdsetData.adsets.data.length; i++) {
    //for (let i = 0; i < 2; i++) {
        const adsetData = {
        //fb_adsets
        adset_id: facebookAdsetData.adsets.data[i].id,
        name: facebookAdsetData.adsets.data[i].name,
        campaign_id: facebookAdsetData.adsets.data[i].campaign_id,
        budget_remaining: facebookAdsetData.adsets.data[i].budget_remaining,
        account_id: "act_" + facebookAdsetData.adsets.data[i].account_id,
        adset_schedule: facebookAdsetData.adsets.data[i].adset_schedule,
        bid_adjustment: facebookAdsetData.adsets.data[i].bid_adjustment,
        bid_amount: facebookAdsetData.adsets.data[i].bid_amount,
        bid_strategy: facebookAdsetData.adsets.data[i].bid_strategy,
        bid_info: facebookAdsetData.adsets.data[i].bid_info,
        created_time: facebookAdsetData.adsets.data[i].created_time,
        daily_budget: facebookAdsetData.adsets.data[i].daily_budget,
        daily_spend_cap: facebookAdsetData.adsets.data[i].daily_spend_cap,
        end_time: facebookAdsetData.adsets.data[i].end_time,
        lifetime_budget: facebookAdsetData.adsets.data[i].lifetime_budget,
        lifetime_spend_cap: facebookAdsetData.adsets.data[i].lifetime_spend_cap,
        recommendations: facebookAdsetData.adsets.data[i].recommendations,
        start_time: facebookAdsetData.adsets.data[i].start_time,
        source_adset: facebookAdsetData.adsets.data[i]?.source_adset || '',
        source_adset_id: facebookAdsetData.adsets.data[i].source_adset_id,
        rf_prediction_id: facebookAdsetData.adsets.data[i].rf_prediction_id,
        review_facebook: facebookAdsetData.adsets.data[i].review_facebook,
        status: facebookAdsetData.adsets.data[i].status,
        targeting: facebookAdsetData.adsets.data[i].targeting,
        targeting_age_min: facebookAdsetData.adsets.data[i].targeting.age_min,
        targeting_age_max: facebookAdsetData.adsets.data[i].targeting.age_max,
        updated_time: facebookAdsetData.adsets.data[i].updated_time,
        omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd',
        ad_ids: facebookAdsetData.adsets.data[i].ad_ids,
        db_updated_at: new Date(),
        pixel_id: facebookAdsetData.adsets.data[i].promoted_object.pixel_id,
        custom_event_type: facebookAdsetData.adsets.data[i].promoted_object.custom_event_type,
        age_max: facebookAdsetData.adsets.data[i].targeting.age_max,
        age_min: facebookAdsetData.adsets.data[i].targeting.age_min,
        geo_countries: facebookAdsetData.adsets.data[i].targeting.geo_locations.countries,
        location_types: facebookAdsetData.adsets.data[i].targeting.geo_locations.location_types,
        brand_safety_content_filter_levels: facebookAdsetData.adsets.data[i].targeting.brand_safety_content_filter_levels,
        targeting_automation: facebookAdsetData.adsets.data[i].targeting.targeting_automation,
            

    }

    await populate_fbadsets(adsetData);


    
    for (let j = 0; j < facebookAdsetData.adsets.data[i].targeting_optimization_types.length; j++) {
        const fbAdsetTargetingOptimizationTypesData = {
            adset_id: facebookAdsetData.adsets.data[i].id,
            key: facebookAdsetData.adsets.data[i].targeting_optimization_types[j].key,
            value: facebookAdsetData.adsets.data[i].targeting_optimization_types[j].value,
        }        
        populate_fb_adset_targeting_optimization_types(fbAdsetTargetingOptimizationTypesData)
    }


    if (facebookAdsetData.adsets.data[i].targeting.flexible_spec && facebookAdsetData.adsets.data[i].targeting.flexible_spec.length > 0) {
        const interests = facebookAdsetData.adsets.data[i].targeting.flexible_spec[0].interests;
        if (interests && interests.length > 0) {
            for (let j = 0; j < interests.length; j++) {
                const fb_flexible_spec = {
                    adset_id: facebookAdsetData.adsets.data[i].id,
                    interest_id: facebookAdsetData.adsets.data[i].targeting.flexible_spec[0].interests[j].id,
                    interest_name: facebookAdsetData.adsets.data[i].targeting.flexible_spec[0].interests[j].name
                }
                populate_fb_adset_flexible_spec(fb_flexible_spec)
            }
        }
    }



    
  
  }
}


main();


