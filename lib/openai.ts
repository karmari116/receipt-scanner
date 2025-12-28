import OpenAI from 'openai';

export async function extractReceiptData(imageBase64: string) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'dummy',
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract the following information from this receipt in JSON format: merchant, date (YYYY-MM-DD), amount (number), currency, category (e.g., Meals, Transport, Office Supplies, etc.). If a field is missing, use null." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${imageBase64}`,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        // Check if content exists and is not null
        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("No content received from OpenAI");
        }

        return JSON.parse(content);
    } catch (error) {
        console.error('Error extracting data with OpenAI:', error);
        throw error;
    }
}
