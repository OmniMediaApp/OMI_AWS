async function insertFbWebhookData(webhookData, postgres) {
  try {
      console.log(webhookData);
      const entry = webhookData.entry[0];
      const entryId = entry.id;
      const timestamp = new Date(entry.time * 1000).toLocaleString();
      const objectType = webhookData.object;
      const changes = JSON.stringify(entry.changes);
      const value_id = entry.changes[0].value.id;
      const value_level = entry.changes[0].value.level;
      const value_status_name = entry.changes[0].value.status_name;
      const change = entry.changes[0];
      const field = change.field;

      if (field === 'with_issues_ad_objects') {
          const insertEntryQuery = `
              INSERT INTO fb_webhook_entries_with_issues (entry_id, object_type, changes, time)
              VALUES ($1, $2, $3, $4)
              RETURNING id;
          `;
          await postgres.query(insertEntryQuery, [entryId, objectType, changes, timestamp]);
          console.log('Data inserted successfully');

      } else if (field === 'in_process_ad_objects') {
          const insertEntryQuery = `
              INSERT INTO fb_webhook_entries_in_process (entry_id, object_type, changes, value_id, value_level, value_status_name, time)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id;
          `;
          await postgres.query(insertEntryQuery, [entryId, objectType, changes, value_id, value_level, value_status_name, timestamp]);
          console.log('Data inserted successfully');
      }
  } catch (error) {
      console.error('Error inserting data:', error);
  }
}

const handleAdAccountChange = (adAccountId, change) => {
  console.log(`Ad Account ID: ${adAccountId}`);
  console.log('Change:', change);

  const { field, value } = change;

  switch (field) {
      case 'CAMPAIGN':
          updateCampaign(adAccountId, value);
          break;
      case 'ADSET':
          updateAdSet(adAccountId, value);
          break;
      case 'AD':
          updateAd(adAccountId, value);
          break;
      case 'CREATIVE':
          updateAdCreative(adAccountId, value);
          break;
      case 'VIDEO':
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
  module.exports =insertFbWebhookData;

