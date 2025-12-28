const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const credentials = JSON.parse(envConfig.GOOGLE_SERVICE_ACCOUNT_JSON);

console.log("EMAIL:", credentials.client_email);
