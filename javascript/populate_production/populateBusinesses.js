require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');

// const dbOptions = {
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_DATABASE,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// };

// const postgres = new Client(dbOptions);

// async function connectDatabase() {
//     try {
//         await postgres.connect();
//         console.log('Connected to the database');
//     } catch (err) {
//         console.error('Connection error', err.stack);
//         process.exit(1);
//     }
// }

async function getBusinesses() {
    const apiUrl = 'https://graph.facebook.com/v19.0/me';
    const fields = 'businesses{verification_status,created_by,created_time,id,name,adspixels{id,last_fired_time,name,owner_ad_account,owner_business},adaccounts{id,name}}';
    const accessToken = process.env.FB_ACCESS_TOKEN;
    
    try {
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

async function populateBusinesses( facebookBusinessData, postgres) {
    const query = `
        INSERT INTO fb_business
            (business_id, business_name, verification_status, created_time, omni_business_id) 
        VALUES 
            ($1, $2, $3, $4, $5)
        ON CONFLICT (business_id) DO UPDATE SET 
            business_name = EXCLUDED.business_name,
            verification_status = EXCLUDED.verification_status,
            created_time = EXCLUDED.created_time,
            omni_business_id = EXCLUDED.omni_business_id;
    `;
   const values = [
        facebookBusinessData.business_id,
        facebookBusinessData.business_name,
        facebookBusinessData.verification_status,
        facebookBusinessData.created_time,
        facebookBusinessData.omni_business_id
    ];

    try {
        await postgres.query(query, values);
        console.log(`Inserted or updated Business: ${facebookBusinessData.business_id} successfully`);
    } catch (err) {
        console.error('Insert or update error:', err.stack);
    }
}

async function populatePixel(pixelData, postgres) {
  const query = `
    INSERT INTO fb_pixels
        (pixel_id, pixel_name, last_fired_time, business_name, owner_ad_account_id, owner_business_id, creation_time, enable_automatic_matching, omni_business_id) 
    VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (pixel_id) DO UPDATE SET 
        pixel_name = EXCLUDED.pixel_name,
        last_fired_time = EXCLUDED.last_fired_time,
        business_name = EXCLUDED.business_name,
        owner_ad_account_id = EXCLUDED.owner_ad_account_id,
        owner_business_id = EXCLUDED.owner_business_id,
        creation_time = EXCLUDED.creation_time,
        enable_automatic_matching = EXCLUDED.enable_automatic_matching,
        omni_business_id = EXCLUDED.omni_business_id;
        
`;
  const values = [
      pixelData.id,
      pixelData.name,
      pixelData.last_fired_time,
      pixelData.business_name,
      pixelData.owner_ad_account,
      pixelData.owner_business,
      pixelData.creation_time,
      pixelData.enable_automatic_matching,
      pixelData.omni_business_id,
  ];

  try {
      await postgres.query(query, values);
      console.log(`Inserted or updated Pixel: ${pixelData.id} successfully`);
  } catch (err) {
      console.error('Insert or update error:', err.stack);
  }
}

async function populateBusinessesMain(postgres) {
    // await connectDatabase();
    const facebookBusinessData = await getBusinesses();
    if (!facebookBusinessData || !facebookBusinessData.businesses) {
      console.error('Invalid business data fetched.');
      process.exit(1);
    }
    for (const business of facebookBusinessData.businesses.data) {
      const businessData = {
          business_id: business.id,
          business_name: business.name,
          verification_status: business.verification_status,
          created_time: business.created_time,
          ad_accounts: business.adaccounts || [], // Collect all ad account data
          omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd' // Adjust as needed
        };
        await populateBusinesses(businessData,postgres).catch(error => {
          console.error('Error inserting business:', error);
          });
      

    if (business.adspixels) {
        for (const pixel of business.adspixels.data) {
            const pixelData = {
                id: pixel.id,
                name: pixel.name,
                last_fired_time: pixel.last_fired_time,
                business_name: business.name,
                owner_ad_account: pixel.owner_ad_account.account_id,
                owner_business: pixel.owner_business.id,
                creation_time: pixel.creation_time,
                enable_automatic_matching: pixel.enable_automatic_matching,
                omni_business_id: 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd'
            };
            await populatePixel(pixelData,postgres).catch(error => {
                console.error('Error inserting pixel:', error);
            });
        
          }
          }
      }
    
    
    
    
    //   await postgres.end();
    // console.log('Database connection closed');

}
// main().catch(err => {
//     console.error('Unhandled error:', err);
//     process.exit(1);
// });
module.exports = populateBusinessesMain