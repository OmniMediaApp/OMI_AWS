


async function insertFbWebhookData(webhookData,postgres) {
    try {
      
      console.log(webhookData)
      const entry = webhookData.entry[0];
      const entryId = entry.id;
      const timestamp = entry.time;
      const objectType = webhookData.object;
      const changes = JSON.stringify(entry.changes);
  
      // Determine the field type
      const change = entry.changes[0];
      const field = change.field;
  
      if (field === 'with_issues_ad_objects') {
        const insertEntryQuery = `
          INSERT INTO fb_webhook_entries_with_issues (entry_id, object_type, changes, timestamp)
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `;
        const entryRes = await [postgres].query(insertEntryQuery, [entryId, objectType, changes, timestamp]);
        const dbEntryId = entryRes.rows[0].id;
  
        const changeValue = change.value;
        const fbId = changeValue.id;
        const level = changeValue.level;
        const errorCode = changeValue.error_code;
        const errorSummary = changeValue.error_summary;
        const errorMessage = changeValue.error_message;
  
        const insertChangeQuery = `
          INSERT INTO fb_ad_issues (entry_id, fb_id, level, error_code, error_summary, error_message, field)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        await postgres.query(insertChangeQuery, [dbEntryId, fbId, level, errorCode, errorSummary, errorMessage, field]);
      } else if (field === 'in_process_ad_objects') {
        const insertEntryQuery = `
          INSERT INTO fb_webhook_entries_in_process (entry_id, object_type, changes, timestamp)
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `;
        const entryRes = await postgres.query(insertEntryQuery, [entryId, objectType, changes, timestamp]);
        const dbEntryId = entryRes.rows[0].id;
  
        const changeValue = change.value;
        const fbId = changeValue.id;
        const level = changeValue.level;
        const statusName = changeValue.status_name;
  
        const insertChangeQuery = `
          INSERT INTO fb_ad_changes (entry_id, fb_id, level, status_name, field)
          VALUES ($1, $2, $3, $4, $5);
        `;
        await postgres.query(insertChangeQuery, [dbEntryId, fbId, level, statusName, field]);
        console.log('Data inserted successfully');
      }
  
      await postgres.query('COMMIT');
      console.log('Data inserted successfully');
    } catch (error) {
      //await postgres.query('ROLLBACK');
      console.error('Error inserting data:', error);
    } finally {
      
    }
  }
  
  // Example webhook data
 
const handleAdAccountChange = (adAccountId, change) => {
  console.log(`Ad Account ID: ${adAccountId}`);
  console.log('Change:', change);


  
  const { field, value } = change;

    switch (field) {
        case 'campaign':
            updateCampaign(adAccountId, value);
            break;
        case 'adset':
            updateAdSet(adAccountId, value);
            break;
        case 'ad':
            updateAd(adAccountId, value);
            break;
        case 'creative':
            updateAdCreative(adAccountId, value);
            break;
        case 'video':
            updateAdVideo(adAccountId, value);
            break;
        default:
            console.log(`Unhandled field: ${field}`);
    }
};

const updateCampaign = (adAccountId, campaignData) => {
    console.log(`Updating campaign for ad account ${adAccountId}:`, campaignData);
};

const updateAdSet = (adAccountId, adSetData) => {
    console.log(`Updating ad set for ad account ${adAccountId}:`, adSetData);
};

const updateAd = (adAccountId, adData) => {
    console.log(`Updating ad for ad account ${adAccountId}:`, adData);
};

const updateAdCreative = (adAccountId, adCreativeData) => {
    console.log(`Updating ad creative for ad account ${adAccountId}:`, adCreativeData);
};

const updateAdVideo = (adAccountId, adVideoData) => {
    console.log(`Updating ad video for ad account ${adAccountId}:`, adVideoData);
};




module.exports = handleAdAccountChange;

module.exports = insertFbWebhookData;