import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const status: { [key: string]: string } = {};
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

const QUEUE_URL = "https://sqs.ap-south-1.amazonaws.com/121933364261/server.fifo";
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const S3_ENDPOINT = "https://s3.ap-south-1.amazonaws.com";

const sqsClient = new SQSClient({ region: "ap-south-1" });

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: ACCESS_KEY as string,
        secretAccessKey: SECRET_KEY as string
    },
    endpoint: S3_ENDPOINT
});

app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();
    status[id as string] = 'Deployment started';
    console.log(`Deployment started for ${id}`);
    
    try {
        await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));
        status[id] = 'Repository cloned';
        console.log(`Repository cloned for ${id}`);

        const files = getAllFiles(path.join(__dirname, `output/${id}`));
        status[id] = 'Files scanned';
        console.log(`Files scanned for ${id}`);

        for (const file of files) {
            await uploadFile(file.slice(__dirname.length + 1), file);
            status[id] = `Uploading: ${file}`;
            console.log(`Uploading file for ${id}: ${file}`);
        }

        status[id] = 'Files uploaded';
        console.log(`Files uploaded for ${id}`);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const command = new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({ id }),
            MessageGroupId: id,
            MessageDeduplicationId: id,
        });

        await sqsClient.send(command);
        status[id] = 'Deployment queued';
        console.log(`Deployment queued for ${id}`);

        res.json({ id: id });
    } catch (error: any) {
        console.error(`Error in deployment process for ${id}:`, error);
        status[id] = `Deployment failed: ${error.message}`;
        res.status(500).json({ error: 'Deployment failed', message: error.message });
    }
});

app.get("/status", (req, res) => {
    const id = req.query.id?.toString() || "";
    console.log(`Status requested for ${id}`);
    if (status[id]) {
        console.log(`Returning status for ${id}: ${status[id]}`);
        res.json({ status: status[id] });
    } else {
        console.log(`Status not found for ${id}`);
        res.status(404).json({ status: 'not found' });
    }
});

app.post("/status", (req, res) => {
    const { id, status: newStatus } = req.body;
    console.log(`Status update received for ${id}: ${newStatus}`);
    if (id && newStatus) {
        status[id] = newStatus;
        console.log(`Status updated for ${id}: ${newStatus}`);
        res.json({ success: true, status: newStatus });
    } else {
        console.log(`Invalid status update request for ${id}`);
        res.status(400).json({ error: 'Invalid status update request' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});