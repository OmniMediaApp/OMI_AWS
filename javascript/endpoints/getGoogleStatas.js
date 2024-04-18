const fetch = require('node-fetch'); // Ensure you have node-fetch or equivalent installed

const customer_id = 4143192746;

async function getGoogleStats(db) {
    let today = new Date();
    
    for (let h = 0; h <90; h++) {
        const day = new Date(today);
        day.setDate(day.getDate() - h); // Decrement the day on each iteration
        const dateFormatted = day.toISOString().split('T')[0];
        
        const data = {
            start_date: dateFormatted
        };
        
        try {
            const apiURL = 'http://13.59.191.31:3001/api/getGoogleSpend';
            
            // Make the POST request
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            // Check if the HTTP status code indicates success before parsing JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json(); // Assuming result is the data we want to save
            if (result == null){
                reslt = null;
            }
            else{
            // Save each day's data to the database
            await saveToDB(db, dateFormatted, result);
            }

        } catch (error) {
            console.error('Error while getting google ad spend:', error);
        }
    }
}

async function saveToDB(db, dateFormatted, data) {
    const res = await db.collection('googleStats')
                        .doc(customer_id.toString())
                        .collection('dates')
                        .doc(dateFormatted)
                        .set(data);

    console.log(`Data for ${dateFormatted} saved successfully.`);
}

module.exports = getGoogleStats;
