import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const s3 = new S3Client({ region: "ap-south-1" });

const UPLOAD_BUCKET_NAME = process.env.UPLOAD_BUCKET_NAME;
const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES, 10) || 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const EXTENSION_BY_CONTENT_TYPE = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf"
};

const formatExtension = (contentType) => EXTENSION_BY_CONTENT_TYPE[contentType] || "bin";

const validateContentType = (contentType) => ALLOWED_CONTENT_TYPES.includes(contentType);

export const handler = async (event) => {
    try {
        const requestBody = event.body ? JSON.parse(event.body) : {};
        const contentType = requestBody.contentType || requestBody.fileType;

        if (!contentType || !validateContentType(contentType)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Invalid or missing contentType. Allowed types: image/jpeg, image/png, application/pdf"
                })
            };
        }

        const fileNameBase = requestBody.fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        const fileName = `uploads/${fileNameBase}.${formatExtension(contentType)}`;

        const { url, fields } = await createPresignedPost(s3, {
            Bucket: UPLOAD_BUCKET_NAME,
            Key: fileName,
            Conditions: [
                ["content-length-range", 0, MAX_FILE_SIZE_BYTES],
                ["eq", "$Content-Type", contentType]
            ],
            Fields: {
                "Content-Type": contentType
            }
        }, { expiresIn: 300 });

        return {
            statusCode: 200,
            body: JSON.stringify({
                uploadUrl: url,
                fields,
                key: fileName,
                allowedContentTypes: ALLOWED_CONTENT_TYPES,
                maxFileSizeBytes: MAX_FILE_SIZE_BYTES
            })
        };

    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate upload URL" })
        };
    }
};