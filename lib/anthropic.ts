import Anthropic from '@anthropic-ai/sdk';

export async function extractReceiptData(imageBase64: string) {
    try {
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Extract the following information from this receipt image in JSON format:
- merchant: The store/vendor name
- date: TRANSACTION DATE (when payment was made) in YYYY-MM-DD format. Use "Date/time", "Transaction Date", or "Payment Date" - NOT service date or visit date.
- amount: Total amount as a number (no currency symbol)
- currency: 3-letter currency code (e.g., USD)
- transactionId: The unique transaction identifier (look for "TRANS ID", "Transaction #", "REF #", or similar)
- category: MUST be exactly one of these expense categories:
  - "Meals & Entertainment"
  - "Travel"
  - "Office Supplies"
  - "Software & Subscriptions"
  - "Professional Services"
  - "Utilities"
  - "Equipment"
  - "Fuel & Auto"
  - "Insurance"
  - "Marketing"
  - "Other"

If a field cannot be determined, use null.
Return ONLY the JSON object with no additional text.`
                        },
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: imageBase64,
                            },
                        }
                    ],
                }
            ],
        });

        // Extract text content
        const textContent = message.content[0].type === 'text' ? message.content[0].text : '';

        // Find JSON in the response (sometimes Claude adds chatty introductions)
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : textContent;

        if (!jsonString) {
            throw new Error("No JSON found in Claude response");
        }

        return JSON.parse(jsonString);

    } catch (error: any) {
        console.error('--- ANTHROPIC ERROR DETAILS ---');
        console.error('Message:', error.message);
        if (error.status) console.error('Status:', error.status);
        if (error.type) console.error('Type:', error.type);
        if (error.error) console.error('API Error:', JSON.stringify(error.error, null, 2));
        console.error('-------------------------------');
        throw error;
    }
}
