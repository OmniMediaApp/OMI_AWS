const crypto = require('crypto');


async function uploadFile(postgres, s3, PutObjectCommand, req, res) {
    try {
        console.log('running upload');
        const file = req.file;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3.send(command);
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

        const query = `
          INSERT INTO file_manager (
            id, type, name, file_type, s3_link, size, created, modified, favorite, omni_business_id, directory, tags, parent_id, contains_num_of_files
          ) VALUES (
            $1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, $10, $11, $12
          )
          RETURNING *;
        `;

        const omni_business_id = req.query.omni_business_id || 'b_zfPwbkxKMDfeO1s9fn5TejRILh34hd';
        const directory = req.query.directory || 'Omni Cloud';
        const favorite = req.query.favorite === 'true'; // or any logic to determine if it's a favorite
        const tags = req.query.tags || null; // if tags are passed as a query parameter
        const parent_id = req.query.parent_id || '/';
        const contains_num_of_files = null; // or set this based on your logic

        const values = [
          generateRandomId(), // id
          getFileType(file.mimetype), // type
          file.originalname, // name
          file.mimetype, // file_type
          fileUrl, // s3_link
          file.size, // size
          favorite, // favorite
          omni_business_id, // omni_business_id
          directory, // directory
          tags, // tags
          parent_id, // parent_id
          contains_num_of_files, // contains_num_of_files
        ];

        const result = await postgres.query(query, values);
        const data = result.rows[0];

        // Send response back to the client
        return data;
    } catch (error) {
        console.error('Error executing query uploadFile:', error);
        // Send error response back to the client
        
    }
}




function generateRandomId() {
    const randomBytes = crypto.randomBytes(4); // Generates 4 random bytes
    const randomId = randomBytes.readUInt32BE(0); // Convert bytes to a 32-bit unsigned integer
    return randomId;
  }


  function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else {
      return 'other';
    }
  }



module.exports = uploadFile;
