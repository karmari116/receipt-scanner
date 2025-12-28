const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const anthropic = new Anthropic({
    apiKey: envConfig.ANTHROPIC_API_KEY,
});

async function testVision() {
    try {
        // Use a simple test image (base64 of a small image)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        console.log("Testing Claude 3.5 Sonnet with image...");
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 100,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'What color is this image? Just say the color.' },
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/png',
                                data: testImageBase64,
                            },
                        }
                    ],
                }
            ],
        });
        console.log("SUCCESS! Sonnet Vision Works!");
        console.log("Response:", message.content[0].text);
    } catch (error) {
        console.error("FAILED!", error.message);
    }
}

testVision();
