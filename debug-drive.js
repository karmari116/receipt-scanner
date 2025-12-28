const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Readable } = require('stream');

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

console.log("--- DRIVE UPLOAD TEST ---");
console.log("Target ID:", envConfig.DRIVE_FOLDER_ID);

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(envConfig.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

async function verifyAndUpload() {
    try {
        // 1. Verify Access
        console.log("1. Verifying Folder Access...");
        await drive.files.get({ fileId: envConfig.DRIVE_FOLDER_ID });
        console.log("✅ ACCESS OK!");

        // 2. Upload Test File
        console.log("2. Uploading Test File...");
        const res = await drive.files.create({
            requestBody: {
                name: 'System_Check_Success.txt',
                parents: [envConfig.DRIVE_FOLDER_ID]
            },
            media: {
                mimeType: 'text/plain',
                body: Readable.from(['If you see this file, the Receipt Scanner is fully operational!'])
            },
            fields: 'id, webViewLink'
        });

        console.log("✅ UPLOAD SUCCESS!");
        console.log("File Link:", res.data.webViewLink);

    } catch (error) {
        console.log("❌ FAILED:", error.message);
        if (error.errors) {
            console.log("Details:", JSON.stringify(error.errors, null, 2));
        }
    }
}

verifyAndUpload();
