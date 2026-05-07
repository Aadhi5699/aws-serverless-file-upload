import {
    S3Client,
    CopyObjectCommand
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: "ap-south-1"
});

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