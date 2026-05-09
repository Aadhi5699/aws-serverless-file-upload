import {
    S3Client,
    CopyObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";

import {
    SNSClient,
    PublishCommand
} from "@aws-sdk/client-sns";

const s3 = new S3Client({
    region: "ap-south-1"
});

const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES, 10) || 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const isValidFile = (contentType, contentLength) => {
    return ALLOWED_CONTENT_TYPES.includes(contentType) && contentLength <= MAX_FILE_SIZE_BYTES;
};

const sns = new SNSClient({
    region: "ap-south-1"
});

const TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const PROCESSED_BUCKET_NAME = process.env.PROCESSED_BUCKET_NAME;

export const handler = async (event) => {

    try {

        console.log("S3 Event:", JSON.stringify(event, null, 2));

        const record = event.Records[0];

        const sourceBucket = record.s3.bucket.name;

        const sourceKey = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, " ")
        );

        const headResult = await s3.send(
            new HeadObjectCommand({
                Bucket: sourceBucket,
                Key: sourceKey
            })
        );

        const contentType = headResult.ContentType || "";
        const contentLength = headResult.ContentLength || 0;

        if (!isValidFile(contentType, contentLength)) {
            console.warn(`Rejected upload ${sourceKey}: contentType=${contentType}, size=${contentLength}`);

            await s3.send(
                new DeleteObjectCommand({
                    Bucket: sourceBucket,
                    Key: sourceKey
                })
            );

            await sns.send(
                new PublishCommand({
                    TopicArn: TOPIC_ARN,
                    Subject: "Invalid File Upload Rejected",
                    Message: `Invalid file upload detected and deleted.\n\nSource: ${sourceBucket}/${sourceKey}\nContent-Type: ${contentType}\nSize: ${contentLength} bytes\nAllowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}\nMax size: ${MAX_FILE_SIZE_BYTES} bytes`
                })
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Invalid file rejected and deleted",
                    key: sourceKey,
                    contentType,
                    contentLength,
                    allowedContentTypes: ALLOWED_CONTENT_TYPES,
                    maxFileSizeBytes: MAX_FILE_SIZE_BYTES
                })
            };
        }

        const destinationBucket = PROCESSED_BUCKET_NAME;

        const destinationKey = `processed-${sourceKey}`;

        await s3.send(
            new CopyObjectCommand({
                Bucket: destinationBucket,
                CopySource: `${sourceBucket}/${sourceKey}`,
                Key: destinationKey
            })
        );

        console.log("File copied successfully");

        // SNS Notification
        await sns.send(
            new PublishCommand({
                TopicArn: TOPIC_ARN,
                Subject: "File Processed Successfully",
                Message: `
File processed successfully.

Source:
${sourceBucket}/${sourceKey}

Processed File:
${destinationBucket}/${destinationKey}
                `
            })
        );

        console.log("SNS notification sent");

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Processing completed"
            })
        };

    } catch (err) {

        console.error("Error processing file:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: err.message
            })
        };
    }
};