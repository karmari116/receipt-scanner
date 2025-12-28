const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

console.log("--- DEBUG ENV ---");

// Check OpenAI
if (envConfig.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY: Present");
    console.log("Key starts with:", envConfig.OPENAI_API_KEY.substring(0, 7));
} else {
    console.log("OPENAI_API_KEY: MISSING");
}

// Check Drive Folder
if (envConfig.DRIVE_FOLDER_ID) {
    console.log("DRIVE_FOLDER_ID: Present");
    console.log("Value:", envConfig.DRIVE_FOLDER_ID);
} else {
    console.log("DRIVE_FOLDER_ID: MISSING");
}

// Check Service Account
if (envConfig.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log("GOOGLE_SERVICE_ACCOUNT_JSON: Present");
    try {
        const json = JSON.parse(envConfig.GOOGLE_SERVICE_ACCOUNT_JSON);
        console.log("JSON Parse Success!");
        console.log("Project ID:", json.project_id);
    } catch (e) {
        console.log("JSON Parse FAILED:", e.message);
        console.log("First 50 chars:", envConfig.GOOGLE_SERVICE_ACCOUNT_JSON.substring(0, 50));
    }
} else {
    console.log("GOOGLE_SERVICE_ACCOUNT_JSON: MISSING");
}
console.log("-----------------");
