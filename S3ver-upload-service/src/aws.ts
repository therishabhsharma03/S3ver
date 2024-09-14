import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
require('dotenv').config();
// Hardcoded SQS queue URL
// const QUEUE_URL = "https://sqs.ap-south-1.amazonaws.com/121933364261/server.fifo";
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
// Hardcoded S3 endpoint URL
const S3_ENDPOINT = "https://s3.ap-south-1.amazonaws.com";

// Initialize SQS client
// const sqsClient = new SQSClient({ region: "ap-south-1" });

// Initialize S3 client with access point
const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: ACCESS_KEY as string,  // Hardcoded access key
        secretAccessKey: SECRET_KEY as string // Hardcoded secret key
    },
    endpoint: S3_ENDPOINT
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        
        // Create a command to upload the file
        const command = new PutObjectCommand({
            Bucket: 's3verrr',
            Key: fileName,
            Body: fileContent,
        });

        // Send the command to S3
        const response = await s3Client.send(command);
        
        console.log(response);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}
