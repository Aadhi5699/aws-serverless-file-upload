import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "ap-south-1" });

export const handler = async (event) => {
    try {
        const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        const command = new PutObjectCommand({
            Bucket: "upload-bucket-7678",
            Key: fileName,
            ContentType: "image/jpeg"
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            body: JSON.stringify({
                uploadUrl: url,
                key: fileName
            })
        };

    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate URL" })
        };
    }
};