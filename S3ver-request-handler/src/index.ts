import express from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
require('dotenv').config();
// S3 endpoint URL
const S3_ENDPOINT = "https://s3.ap-south-1.amazonaws.com";
const { ACCESS_KEY, SECRET_KEY } = process.env;
// Initialize S3 client with credentials
const s3 = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: ACCESS_KEY as string,  // Hardcoded access key
        secretAccessKey: SECRET_KEY as string  // Hardcoded secret key
    },
    endpoint: S3_ENDPOINT
});

const app = express();

app.get('/*', async (req, res) => {
    try {
        // Extract the ID from the subdomain (first part of the host)
        const host = req.hostname;
        const id = host.split('.')[0];  // Extracting id from subdomain

        // Get the file path from the request
        const filePath = req.path;

        // Prepare the S3 GetObject command
        const command = new GetObjectCommand({
            Bucket: 's3verrr',
            Key: `build/${id}${filePath}`,
        });

        // Fetch the object from S3
        const data = await s3.send(command);
        console.log('Received request for:', filePath);

        // Set appropriate content type based on file extension
        const contentType = filePath.endsWith('.html') ? 'text/html' :
                            filePath.endsWith('.css') ? 'text/css' :
                            filePath.endsWith('.js') ? 'application/javascript' :
                            'application/octet-stream';  // Default content type
        res.set('Content-Type', contentType);

        // Check if Body is available
        if (data.Body) {
            if (data.Body instanceof Readable) {
                // Pipe the Readable stream to the response
                data.Body.pipe(res);
            } else if (Buffer.isBuffer(data.Body)) {
                // Send the buffer if Body is a buffer
                res.send(data.Body);
            } else {
                // Handle other types of body content
                res.status(500).send('Error processing file');
            }
        } else {
            res.status(404).send('File not found');
        }
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});
