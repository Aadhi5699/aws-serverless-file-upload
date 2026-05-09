# API Endpoints

## Upload Endpoint

POST /upload

Request body:
- `contentType` (required): MIME type of the file being uploaded
- `fileName` (optional): desired base file name

Restrictions:
- Allowed types: `image/jpeg`, `image/png`, `application/pdf`
- Max file size: 5 MB by default (`MAX_FILE_SIZE_BYTES`)

Returns:
- Pre-signed upload URL
- Object key