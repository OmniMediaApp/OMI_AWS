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
      const accessToken = 'EAAMJLvHGvzkBO9zE5PdLpOgz6znK10wZAYF97ZCocVMJ3FCQt8Fbh9sHRJFTSJnL3K4gCXxOuTB5z4eqZCLECSIBMJOYRjL1eMZClUXytfISbi3F183XPClkZAar6E2W7nRmkBR3hAZCZBx9PWypOuvJHlKjoNod8YZAcrTtZB2kWZBb29ZC9c14jFDqllZCiWQYnmuf3DIcvuYyGw0SWTZBf1VnZCGohVcmmx8cSOJLSM6Wxb1f4ZD'; // Replace with your Facebook access token
      
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
        INSERT INTO fb_adsets 
          (adset_id, name, campaign_id, budget_remaining, account_id, adset_schedule, bid_adjustment, bid_amount, bid_strategy, bid_info, created_time, 
            daily_budget, daily_spend_cap, end_time, lifetime_budget, lifetime_spend_cap, recommendations, start_time, source_adset, source_adset_id, 
            rf_prediction_id, review_facebook, status, targeting_age_min, targeting_age_max, updated_time, omni_business_id, ad_ids, db_updated_at ) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        ON CONFLICT (adset_id) DO UPDATE SET 
            name = EXCLUDED.name,
            campaign_id = EXCLUDED.campaign_id,
            budget_remaining = EXCLUDED.budget_remaining,
            account_id = EXCLUDED.account_id,
            adset_schedule = EXCLUDED.adset_schedule,
            bid_adjustment = EXCLUDED.bid_adjustment,
            bid_amount = EXCLUDED.bid_amount,
            bid_strategy = EXCLUDED.bid_strategy,
            bid_info = EXCLUDED.bid_info,
            created_time = EXCLUDED.created_time,
            daily_budget = EXCLUDED.daily_budget,
            daily_spend_cap = EXCLUDED.daily_spend_cap,
            end_time = EXCLUDED.end_time,
            lifetime_budget = EXCLUDED.lifetime_budget,
            lifetime_spend_cap = EXCLUDED.lifetime_spend_cap,
            recommendations = EXCLUDED.recommendations,
            start_time = EXCLUDED.start_time,
            source_adset = EXCLUDED.source_adset,
            source_adset_id = EXCLUDED.source_adset_id,
            rf_prediction_id = EXCLUDED.rf_prediction_id,
            review_facebook = EXCLUDED.review_facebook,
            status = EXCLUDED.status,
            targeting_age_min = EXCLUDED.targeting_age_min,
            targeting_age_max = EXCLUDED.targeting_age_max,
            updated_time = EXCLUDED.updated_time,
            omni_business_id = EXCLUDED.omni_business_id,
            ad_ids = EXCLUDED.ad_ids,
            db_updated_at = EXCLUDED.db_updated_at;
        `;
    
      const values = [
        facebookAdsetData.adset_id, facebookAdsetData.name, facebookAdsetData.campaign_id, facebookAdsetData.budget_remaining, 
        facebookAdsetData.account_id, facebookAdsetData.adset_schedule, facebookAdsetData.bid_adjustment, facebookAdsetData.bid_amount, 
        facebookAdsetData.bid_strategy, facebookAdsetData.bid_info, facebookAdsetData.created_time, facebookAdsetData.daily_budget, 
        facebookAdsetData.daily_spend_cap, facebookAdsetData.end_time, facebookAdsetData.lifetime_budget, facebookAdsetData.lifetime_spend_cap, 
        facebookAdsetData.recommendations, facebookAdsetData.start_time, facebookAdsetData.source_adset, facebookAdsetData.source_adset_id,        
        facebookAdsetData.rf_prediction_id, facebookAdsetData.review_facebook, facebookAdsetData.status, facebookAdsetData.targeting_age_min, facebookAdsetData.targeting_age_max, 
        facebookAdsetData.updated_time, facebookAdsetData.omni_business_id, facebookAdsetData.ad_ids, facebookAdsetData.db_updated_at

      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated adset: ${facebookAdsetData.adset_id} successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };




  async function populate_fb_adset_targeting_interests(fbAdsetTargetingInterestData) {
    try {
        const query = `
        INSERT INTO fb_adset_targeting_interests 
          (interest_id, interest_name, adset_id) 
        VALUES 
          ($1, $2, $3)
        `;
    
      const values = [
        fbAdsetTargetingInterestData.interest_id, fbAdsetTargetingInterestData.interest_name, fbAdsetTargetingInterestData.adset_id
      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated adset: ${fbAdsetTargetingInterestData.adset_id} into fb_adset_targeting_interests successfully`);
    } catch (err) {
      console.error('Insert or update error:', err);
    } finally {
      // Close the client connection
      //client.end();
    }
  };
  


  async function populate_fb_adset_targeting_countries(fbAdsetTargetingCountryData) {
    try {
        const query = `
        INSERT INTO fb_adset_targeting_countries
          (adset_id, country) 
        VALUES 
          ($1, $2)
        `;
    
      const values = [
        fbAdsetTargetingCountryData.adset_id, fbAdsetTargetingCountryData.country
      ];
  
      const result = await client.query(query, values);
      console.log(`Inserted or updated adset: ${fbAdsetTargetingCountryData.adset_id} into fb_adset_targeting_countries successfully`);
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
  //for (let i = 0; i < 1; i++) {
        const adsetData = {
        //fb_adsets
        adset_id: facebookAdsetData.adsets.data[i].id,
        name: facebookAdsetData.adsets.data[i].name,
        campaign_id: facebookAdsetData.adsets.data[i].campaign_id,
        budget_remaining: facebookAdsetData.adsets.data[i].budget_remaining,
        account_id: facebookAdsetData.adsets.data[i].account_id,
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

                

                //fb_adset_targeting_location_types
                location_types: facebookAdsetData.adsets.data[i].targeting.geo_locations.location_types[0],
                //fb_adset_targeting_optimization_types
                key: facebookAdsetData.adsets.data[i].targeting_optimization_types[0].key,
                value: facebookAdsetData.adsets.data[i].targeting_optimization_types[0].value,
    }

    const targetingData = facebookAdsetData.adsets.data[i].targeting;
    const interestsArray = targetingData && targetingData.flexible_spec && targetingData.flexible_spec[0] && targetingData.flexible_spec[0].interests;
    const numberOfInterests = interestsArray ? interestsArray.length : 1;
    
    for (let j = 0; j < numberOfInterests; j++) {
        const interest = interestsArray && interestsArray[j];
        const interest_id = interest ? interest.id : 0;
        const interest_name = interest ? interest.name : "none";
    
        const fbAdsetTargetingInterestData = {
            //fb_adset_targeting_interests
            adset_id: facebookAdsetData.adsets.data[i].id,
            interest_id: interest_id,
            interest_name: interest_name,
        };
    
        populate_fb_adset_targeting_interests(fbAdsetTargetingInterestData);
    }
    

    const geo_locations = facebookAdsetData.adsets.data[i].targeting.geo_locations;
    const countriesArray = geo_locations && geo_locations.countries;
    const numberOfCountries = countriesArray ? countriesArray.length : 0;
    
    for (let j = 0; j < numberOfCountries; j++) {
        const country = countriesArray && countriesArray[j];
    
        const fbAdsetTargetingCountryData = {
            //fb_adset_targeting_countries
            adset_id: facebookAdsetData.adsets.data[i].id,
            country: country || "none",
        };
    
        populate_fb_adset_targeting_countries(fbAdsetTargetingCountryData);
    }
    



    
    populate_fbadsets(adsetData);
  
  }
}


main();


