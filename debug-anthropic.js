const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log("Loading .env.local from:", envPath);

if (fs.existsSync(envPath)) {
    console.log("File exists!");
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    console.log("--- KEY CHECK ---");
    if (envConfig.ANTHROPIC_API_KEY) {
        console.log("ANTHROPIC_API_KEY: Present");
        console.log("Length:", envConfig.ANTHROPIC_API_KEY.length);
        console.log("Prefix:", envConfig.ANTHROPIC_API_KEY.substring(0, 10) + "...");
    } else {
        console.log("ANTHROPIC_API_KEY: MISSING in .env.local");
    }
} else {
    console.log("CRITICAL: .env.local file NOT FOUND");
}
