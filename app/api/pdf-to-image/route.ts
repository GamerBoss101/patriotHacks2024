// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        let res = await fetch("http://localhost:5000/convert", {
            method: 'POST',
            body: formData
        });
        res = await res.json();

        const pdfBuffer = await res[0];

        let b64 = await toBase64(pdfBuffer);
        console.log(b64);
        
        return NextResponse.json({ message: 'PDF converted successfully' });
    } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
