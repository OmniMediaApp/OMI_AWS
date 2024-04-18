const axios = require('axios');
const cheerio = require('cheerio');


async function scrapeWebpage(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
  
      // Extract images
      const imageInfoArray = [];
      $('img').each((index, element) => {
        const img = $(element);
        const width = img.attr('width') || 0;
        const height = img.attr('height') || 0;
        if (width >= 450 && height >= 450) {
          imageInfoArray.push({
            src: img.attr('src') && img.attr('src').startsWith('https:') ? img.attr('src') : 'https:' + img.attr('src'),
            alt: img.attr('alt') || 'N/A',
            width: width || 'N/A',
            height: height || 'N/A',
            pixels: width * height
          });
        }
      });
  
      // Extract product name from h1 elements
      const productName = $('h1').map((index, element) => $(element).text().trim()).get().join(' ');
  
      // Extract product description from p elements
      const productDescription = $('p').map((index, element) => $(element).text().trim()).get().join(' ');
  
      return {
        imageInfoArray,
        product_name: productName || 'N/A',
        product_description: productDescription || 'N/A',
      };
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

  

  module.exports = scrapeWebpage