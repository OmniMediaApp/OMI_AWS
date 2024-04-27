const { Client } = require('pg');
const axios = require('axios');


const dbOptions = {
    user: 'postgres',
    host: 'omnirds.cluster-chcpmc0xmfre.us-east-2.rds.amazonaws.com',
    database: 'postgres',
    password: 'Omni2023!',
    port: '5432',
  };

const client = new Client(dbOptions);

client.connect()
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Connection error', err.stack));


async function getAdsets () {
    try{
    const apiUrl = 'https://graph.facebook.com/v19.0/act_331027669725413';
    const fields = 'ads{account_id,ad_active_time,ad_review_feedback,ad_schedule_end_time,ad_schedule_start_time,adset_id,campaign_id,configured_status,conversion_domain,created_time,creative,id,effective_status,bid_amount,last_updated_by_app_id,name,preview_shareable_link,recommendations,source_ad,source_ad_id,status,tracking_specs,updated_time,adcreatives{id}}'
    const accessToken = 'EAAMJLvHGvzkBO8B2O2ngIus8HfFhO4AbUMJR8dSjlAfkEbZB5n62VjkYIdCfv8p7nl2TXiTHlUwqlOJRI23QekFnuHUOTvppGvkU7xgQ3dYZCZCxdH43ZCYS3lrBOnABSDb3hCrbnRrICE8d126F4MGs3HWku6CvqKpCerjtaOqgkychgm0qz4xzNSRO64EY2LRJ0ogRi6bZAjBpKxO9zyoVoyAZDZD'
    
    
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
  
async function adsetEsists(adsetId){
    const query = `
    SELECT 1 FROM fb_ad WHERE adset_id = $1
    `;
    const result = await client.query(query, [adsetId]);
    return result.rowCount > 0;
}
async function populateAds(facebookAdData){
    if (!(await adsetEsists(facebookAdData.adset_id))) {
        console.log('Skipping insertion for ad with non-existent adset_id:', facebookAdData.adset_id);
        return; 
    }
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
        omni_business_id = EXCLUDED.omni_business_id
   
    `;
    const values = [
        facebookAdData.id, facebookAdData.adset_id, facebookAdData.campaign_id, "act_"+facebookAdData.account_id, 
        facebookAdData.name, facebookAdData.configured_status, facebookAdData.created_time, 
        facebookAdData.creative, facebookAdData.effective_status, facebookAdData.last_updated_by_app_id, 
        facebookAdData.preview_shareable_link, facebookAdData.source_ad,  `{${facebookAdData.source_ad_id}}`, 
        facebookAdData.status, JSON.stringify(facebookAdData.tracking_specs), facebookAdData.ad_active_time, "b_zfPwbkxKMDfeO1s9fn5TejRILh34hd"
    ];
    try {
        await client.query(query, values);
    } catch (error) {
        if (error.message.includes("violates foreign key constraint")) {
            console.log('Skipping insertion due to missing foreign key:', error.detail);
            return; // Skip further processing
        }
        console.error('Error inserting data:', error);
    }
}
async function main() {
    try {
        
        const facebookAdData = await getAdsets();
        for (let ad of facebookAdData.ads.data) {
            await populateAds(ad);
        }
    } catch (error) {
        console.error('Error during operation:', error);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

main()