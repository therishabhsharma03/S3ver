import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as fs from "fs";
import * as path from "path";
require('dotenv').config();
// Hardcoded SQS queue URL

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;





// Hardcoded SQS queue URL
// const QUEUE_URL = "https://sqs.ap-south-1.amazonaws.com/121933364261/server.fifo";

// Hardcoded S3 endpoint URL
const S3_ENDPOINT = "https://s3.ap-south-1.amazonaws.com";

// Initialize SQS client
// const sqsClient = new SQSClient({ region: "ap-south-1" });

// Initialize S3 client with access point
const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: ACCESS_KEY as string,  // Replace with your actual access key
        secretAccessKey: SECRET_KEY as string,  // Replace with your actual secret key
    },
    endpoint: S3_ENDPOINT
});



export async function downloadS3Folder(prefix: string) {
    try {
        console.log(`Attempting to download S3 folder with prefix: ${prefix}`);
        // console.log(prefix + " Downloading S3 folder...");

        // List all objects in the S3 folder
        const listCommand = new ListObjectsV2Command({
            Bucket: "s3verrr",
            Prefix:prefix   
        });
        console.log('ListCommand:', JSON.stringify(listCommand, null, 2));

        try {
            const allFiles = await s3Client.send(listCommand);
            console.log('S3 List Command Response:', allFiles);
        } catch (error) {
            console.error('Error sending S3 list command:', error);
        }
        const allFiles = await s3Client.send(listCommand);
        // @tsc_ignore
        console.log('All files:', JSON.stringify(allFiles, null, 2));

        if (!allFiles.Contents || allFiles.Contents.length === 0) {
            console.error("No objects found for the given prefix:", prefix);
            return;
        }

        // Map over each file in the S3 folder
        const allPromises = allFiles.Contents.map(async (file) => {
            const { Key } = file;

            if (!Key) {
                console.error('No Key found for file:', file);
                return Promise.resolve(); // Skip files without a key
            }

            console.log('Processing key:', Key);
            const finalOutputPath = path.join(__dirname, Key);
            const dirName = path.dirname(finalOutputPath);

            // Create the directory if it doesn't exist
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }

            const outputFile = fs.createWriteStream(finalOutputPath);

            try {
                // Get the object from S3
                const getCommand = new GetObjectCommand({
                    Bucket: "s3verrr",
                    Key: Key
                });

                const { Body } = await s3Client.send(getCommand);

                // Ensure Body is a readable stream
                if (Body instanceof Readable) {
                    Body.pipe(outputFile).on("finish", () => {
                        console.log(`Downloaded ${Key} to ${finalOutputPath}`);
                    }).on("error", (err) => {
                        console.error(`Error writing file ${finalOutputPath}:`, err);
                    });
                } else {
                    throw new Error("Body is not a readable stream.");
                }
            } catch (err) {
                console.error(`Error downloading ${Key}:`, err);
                throw err;  // Ensure errors are propagated
            }
        });

        console.log("Awaiting all file downloads...");
        await Promise.all(allPromises);
        console.log("Download complete.");
    } catch (err) {
        console.error("Error downloading S3 folder:", err);
    }
}



export async function copyFinalDist(id: string) {
    const folderPath = path.join(__dirname, `output/${id}/build`); // Changed from 'dist' to 'build'
    const allFiles = getAllFiles(folderPath);
    const uploadPromises = allFiles.map(file => {
        return uploadFile(`build/${id}/` + file.slice(folderPath.length + 1), file); // Also update the S3 key to match 'build'
    });

    await Promise.all(uploadPromises);
}


const getAllFiles = (folderPath: string) => {
    let response: string[] = [];
    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
}

const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const command = new PutObjectCommand({
        Body: fileContent,
        Bucket: "s3verrr",
        Key: fileName,
    });

    try {
        const response = await s3Client.send(command);
        console.log(response);
    } catch (error) {
        console.error('Error uploading file to S3:', error);
    }
}

