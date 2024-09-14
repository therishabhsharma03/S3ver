import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
import axios from "axios";

require('dotenv').config();

const ACCESS_KEY = process.env.ACCESS_KEY as string;
const SECRET_KEY = process.env.SECRET_KEY as string;
const sqsClient = new SQSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
    endpoint: "https://sqs.ap-south-1.amazonaws.com"
});

const queueUrl = 'https://sqs.ap-south-1.amazonaws.com/121933364261/server.fifo';
const statusUpdateUrl = 'http://localhost:3000/status';

console.log('Listening for messages...');

async function receiveMessage() {
    const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20
    });

    try {
        const data = await sqsClient.send(command);
        return data.Messages && data.Messages.length > 0 ? data.Messages[0] : null;
    } catch (error) {
        console.error('Error receiving message from SQS:', error);
        return null;
    }
}

async function deleteMessage(receiptHandle?: string) {
    if (!receiptHandle) {
        console.error('Invalid receipt handle');
        return;
    }

    const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
    });

    try {
        await sqsClient.send(command);
        console.log('Message deleted from SQS');
    } catch (error) {
        console.error('Error deleting message from SQS:', error);
    }
}

async function updateStatus(id: string, status: string) {
    try {
        const response = await axios.post(statusUpdateUrl, { id, status });
        console.log(`Status updated for ${id}: ${status}`);
        console.log('Server response:', response.data);
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

async function main() {
    try {
        while (true) {
            console.log('Waiting for message...');
            const message = await receiveMessage();
            if (message && message.Body) {
                const messageBody = JSON.parse(message.Body);
                const id = messageBody.id;
                console.log('Received message:', id);
                if (id) {
                    try {
                        await updateStatus(id, 'Processing started');

                        console.log('Downloading S3 folder...');
                        await updateStatus(id, 'Downloading S3 folder');
                        await downloadS3Folder(`output/${id}`);
                        console.log('S3 folder downloaded successfully');

                        console.log('Building project...');
                        await updateStatus(id, 'Building project');
                        await buildProject(id);
                        console.log('Project built successfully');

                        console.log('Copying final dist...');
                        await updateStatus(id, 'Copying final dist');
                        copyFinalDist(id);
                        console.log('Final dist copied successfully');

                        await updateStatus(id, 'Deployed');
                        console.log('Deployment completed');

                        await deleteMessage(message.ReceiptHandle);
                    } catch (error: any) {
                        console.error('Error processing message:', error);
                        await updateStatus(id, `Deployment failed: ${error.message}`);
                    }
                } else {
                    console.error('Received message with undefined ID');
                }
            }
        }
    } catch (error) {
        console.error('Error in main loop:', error);
    }
}

process.on('SIGINT', () => {
    console.log('Gracefully shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Gracefully shutting down...');
    process.exit(0);
});

main().catch(console.error);