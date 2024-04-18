const admin = require('firebase-admin');
const fetch = require('node-fetch');
const serviceAccount = require('../ServiceAccountKey.json'); // Adjust the path as necessary

// Assuming Firebase Admin SDK has already been initialized elsewhere in your application,
// like in your main server file (API.js or app.js)


async function uploadMediaToFirebase(uri, isVideo) {
  const response = await fetch(uri);
  console.log("uri :", uri);
  console.log("responce", response);
  const bucket = admin.storage().bucket();
  const buffer = await response.buffer();
  const timestamp = Date.now();
  const fileExtension = isVideo ? '.mp4' : '.jpg';
  const fileName = `${timestamp}${fileExtension}`;
  const folderName = isVideo ? 'adVideos' : 'adImages';
  const file = bucket.file(`${folderName}/${fileName}`);

  await file.save(buffer);
  await file.makePublic(); // Ensure the file is accessible publicly
  // Correct the method to obtain the public URL of the file
  const mediaUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
  return mediaUrl;
}

// Corrected Express route handler
async function handleMediaUpload(req, res) {
  const { uri, isVideo } = req.body;
  try {
    const mediaUrl = await uploadMediaToFirebase(uri, isVideo);
    res.status(200).send({ success: true, mediaUrl });
  } catch (error) {
    console.error(`Error handling upload: ${error}`);
    res.status(500).send({ success: false, error: error.message });
  }
}

module.exports = handleMediaUpload;