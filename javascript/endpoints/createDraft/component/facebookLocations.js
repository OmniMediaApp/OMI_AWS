const axios = require('axios');


async function facebookLocationSuggestions(query, accessToken) {
    const url= `https://graph.facebook.com/v2.11/search?location_types=["country","city","region"]&type=adgeolocation&q=${query.toString()}&access_token=${accessToken}&limit=5`;
    //console.log("URL: " + url)
    return axios.get(url)
      .then(function (response) {
        //console.log(JSON.stringify(response.data.data));
        return response.data.data;
      })
      .catch(function (error) {
        console.error(error.response);
      });
}


module.exports = facebookLocationSuggestions