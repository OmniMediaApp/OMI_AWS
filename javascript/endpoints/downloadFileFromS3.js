const axios = require('axios');

async function downloadFileFromS3(postgres, req, res) {
  try {
    // Extract the S3 URL and file name from the request parameters or query
    const s3Url = req.query.s3Url
    const fileName = req.query.fileName

    // Make a GET request to the S3 URL to fetch the file content
    const response = await axios.get(s3Url, {
      responseType: 'arraybuffer', // Set response type to 'arraybuffer' for binary data
    });

    // Set the appropriate headers for the response
    res.set({
      'Content-Disposition': `attachment; filename="${fileName}"`, // Set file name for download
      'Content-Type': response.headers['content-type'], // Set content type based on response
    });

    // Send the file content as the response
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Internal server error');
  }
}



module.exports = downloadFileFromS3

