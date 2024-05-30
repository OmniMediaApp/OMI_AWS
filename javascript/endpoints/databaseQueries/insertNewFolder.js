const crypto = require('crypto');


async function insertNewFolder(postgres, req, res) {
    try {
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
        const tags = req.query.tags || null; // if tags are passed as a query parameter
        const parent_id = req.query.parent_id || '/';
        const contains_num_of_files = null; // or set this based on your logic

        const values = [
            generateRandomId(), // id
            'folder', // type
            'New Folder', // name
            null, // file_type
            null, // s3_link
            0, // size
            false, // favorite
            omni_business_id, // omni_business_id
            directory, // directory
            tags, // tags
            parent_id, // parent_id
            contains_num_of_files, // contains_num_of_files
        ];

        
        const result = await postgres.query(query, values);
        const data = result.rows;
        
        // Send response back to the client
        return data
    } catch (error) {
        console.error('Error executing query insertNewFolder:', error);
        // Send error response back to the client
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
}


function generateRandomId() {
    const randomBytes = crypto.randomBytes(4); // Generates 4 random bytes
    const randomId = randomBytes.readUInt32BE(0); // Convert bytes to a 32-bit unsigned integer
    return randomId;
}






module.exports = insertNewFolder;
