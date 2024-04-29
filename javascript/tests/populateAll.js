const { Client } = require('pg');
const axios = require('axios');
const populateCampaignsMain = require('./populateCampaigns');
const populateAdAccountsMain = require('./populateAdAccounts');




// AWS RDS POSTGRESQL INSTANCE
const dbOptions = {
  user: 'postgres',
  host: 'omnirds.cluster-chcpmc0xmfre.us-east-2.rds.amazonaws.com',
  database: 'postgres',
  password: 'Omni2023!',
  port: '5432',
};

// Create a new PostgreSQL client
const postgres = new Client(dbOptions);

// Connect to the PostgreSQL database
postgres.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Connection error', err.stack));




const omniBusinessId = 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd';
const accessToken = 'EAAMJLvHGvzkBO2DmjIBVZA65h71ksz2JCQWaPlVmF6vyZCZBmDwhj2c2UHh6CS0tX1vljztwyHaExxtQOjzEoRJwNaG2OeNk1ZBMZBQ23V38XhXZCVsdKqucwnhT3KAQ9cKPU24mpaDMWc7ZAIdKLOvt1iZBsrraGZABn34gf2yDZAC3TvpQSZBMDQZBVn0XYBhk9WfEnnnR09ojte6pGGewVeCm0yVjZCZB6ta8OlUZCTZCKs6H3QZDZD'






async function populateAll () {
    populateBusinessMain(postgres, omniBusinessId)
    populateAdAccountsMain(postgres, omniBusinessId, accessToken)
    populateCampaignsMain(postgres, omniBusinessId)
}


populateAll();


