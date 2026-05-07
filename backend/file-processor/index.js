import {
    S3Client,
    CopyObjectCommand
} from "@aws-sdk/client-s3";

import {
    SNSClient,
    PublishCommand
} from "@aws-sdk/client-sns";

const s3 = new S3Client({
    region: "ap-south-1"
});

const sns = new SNSClient({
    region: "ap-south-1"
});

const TOPIC_ARN = "arn:aws:sns:ap-south-1:050366487790:file-processing-topic";

export const handler = async (event) => {

    try {

        console.log("S3 Event:", JSON.stringify(event, null, 2));

        const record = event.Records[0];

        const sourceBucket = record.s3.bucket.name;

        const sourceKey = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, " ")
        );

        const destinationBucket = "processed-bucket-6785";

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