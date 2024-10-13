import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { imageURL, type } = await request.json();

        if (!imageURL) {
            return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
        }

        const payload = {
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: ` Analyze the following ${type} bill image and extract the following information:
                                        1. Multiple data points of usage, each with a date and ${type === 'gas' ? 'therms' : 'kWh'} used
                                        2. Any other relevant usage data

                                    Format the output as a JSON object with an array of data points and any additional data.
                                    You must output valid JSON in the following format:
                                    {
                                        "dataPoints": [
                                            {
                                                "date": "<ISO 8601 date string>",
                                                "usage": <number>
                                            },
                                            // ... more data points
                                        ]
                                    }

                                    Image: ${imageURL}

                            `
                        }
                    ]
                }
            ],
            temperature: 0.7,
            top_p: 0.95,
            max_tokens: 1000
        };

        const response = await fetch(process.env.OPENAI_ENDPOINT as string, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.OPENAI_API_KEY as string,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Failed to generate description: ' + response.status + " " + response.statusText);
        }

        const data = await response.json();
        const description = data.choices[0].message.content;

        return NextResponse.json({ description });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

