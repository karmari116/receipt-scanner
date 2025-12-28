import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export async function uploadToDrive(fileBuffer: Buffer, fileName: string, mimeType: string) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
            scopes: SCOPES,
        });

        const drive = google.drive({ version: 'v3', auth });

        const fileMetadata = {
            name: fileName,
            parents: [process.env.DRIVE_FOLDER_ID!],
        };

        const media = {
            mimeType: mimeType,
            body: Readable.from(fileBuffer),
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        return response.data;
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        throw error;
    }
}
