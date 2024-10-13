// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';

import { toBase64 } from 'openai/core';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        let res = await fetch(process.env.PDF_URI, {
            method: 'POST',
            body: formData
        });
        res = await res.json();

        const pdfBuffer = await res[0];

        let b64 = await toBase64(pdfBuffer);
        console.log(b64);
        console.log(request);

        // Step 2: Use the image with the chat route
        const chatResponse = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageURL: `data:image/png;base64,${b64}`,
                type: formData.get('type'),
            }),
        });

        const chatData = await chatResponse.json();
        console.log("CHAT RESPONSE", chatData);

        return NextResponse.json({ message: 'PDF converted successfully', response: chatData });
    } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
