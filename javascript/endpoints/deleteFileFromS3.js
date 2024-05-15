const axios = require('axios');


async function deleteFileFromS3(key) {
  try {
    // Construct parameters for the delete operation
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };

    // Delete the file from S3
    await s3.deleteObject(params).promise();

    console.log(`File ${key} deleted successfully from S3`);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
}



module.exports = downloadFileFromS3

