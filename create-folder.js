const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(envConfig.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });
const USER_EMAIL = 'Karmari116@gmail.com'; // From screenshot

async function createAndShare() {
    try {
        console.log("Creating new folder...");
        const folder = await drive.files.create({
            requestBody: {
                name: 'Receipts_App_Automated',
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id, webViewLink'
        });

        console.log("Folder Created! ID:", folder.data.id);
        console.log("Link:", folder.data.webViewLink);

        console.log(`Sharing with ${USER_EMAIL}...`);
        await drive.permissions.create({
            fileId: folder.data.id,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: USER_EMAIL
            }
        });
        console.log("SUCCESS! Folder shared.");

        // Return ID for next step
        console.log("NEW_ID:" + folder.data.id);

    } catch (error) {
        console.error("Failed:", error.message);
    }
}

createAndShare();
