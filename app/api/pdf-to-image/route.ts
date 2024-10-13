import { NextRequest, NextResponse } from 'next/server';
import { pdf } from 'pdf-to-img';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const pdfFile = formData.get('pdf') as File;

        if (!pdfFile) {
            return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
        }

        const arrayBuffer = await pdfFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log(uint8Array);

        const document = await pdf(uint8Array);

        console.log(document);


        return NextResponse.json({ message: 'PDF converted successfully' });
    } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
