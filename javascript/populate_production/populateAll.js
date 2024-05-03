require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const axios = require('axios');
// const populateCampaignsMain = require('./populateCampaigns');
// const populateAdAccountsMain = require('./populateAdAccounts');
const populateBusinessMain = require('./populateBusinesses');


// AWS RDS POSTGRESQL INSTANCE
const dbOptions = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// Create a new PostgreSQL client
const postgres = new Client(dbOptions);

// Connect to the PostgreSQL database
postgres.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Connection error', err.stack));




const omniBusinessId = 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd';
const accessToken = process.env.FB_ACCESS_TOKEN;






async function populateAll () {
    populateBusinessMain(postgres, omniBusinessId)
    // populateAdAccountsMain(postgres, omniBusinessId, accessToken)
    // populateCampaignsMain(postgres, omniBusinessId)
}


populateAll();


