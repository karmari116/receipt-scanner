const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

console.log("Found Key:", envConfig.ANTHROPIC_API_KEY ? "Yes" : "No");

const anthropic = new Anthropic({
    apiKey: envConfig.ANTHROPIC_API_KEY,
});

async function test() {
    try {
        console.log("Sending test message to Claude...");
        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            messages: [
                { role: 'user', content: 'Hello, say "Connection Working" if you can read this.' }
            ],
        });
        console.log("SUCCESS!");
        console.log("Response:", message.content[0].text);
    } catch (error) {
        console.error("FAILED!");
        console.error("Error Type:", error.constructor.name);
        console.error("Message:", error.message);
        if (error.error) {
            console.error("API Error Details:", JSON.stringify(error.error, null, 2));
        }
    }
}

test();
