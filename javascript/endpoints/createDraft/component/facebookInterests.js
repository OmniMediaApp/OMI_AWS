const axios = require('axios');


async function checkInterestsWithFacebook(query, accessToken) {
    const url = `https://graph.facebook.com/search?type=adinterestsuggestion&interest_list=${query.toString()}&limit=10&locale=en_US&access_token=${accessToken}`;
    try {
        const response = await axios.get(url);
        const data = response.data.data.filter(item => item.audience_size > 200000);
        //console.log(JSON.stringify(data));
        return data;
    } catch (error) {
        console.error(error.response);
    }
}


module.exports = checkInterestsWithFacebook