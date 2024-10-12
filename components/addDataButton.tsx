// components/addDataButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { pdfjs } from 'react-pdf';
import { OpenAIStream } from 'ai';

import { PlusIcon } from "./icons";

import { useBuilding } from "@/lib/useBuildingData";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface AddDataButtonProps {
    buildingid: string;
}

async function extractElectricityData(file: File) {
    // Convert PDF pages to images
    const images = await pdfToImages(file);

    // Prepare the prompt with all images
    const prompt = `Here are images of an electricity bill. Please analyze them and create a JSON object with the electricity usage by month, including the amount used. The JSON should have a 'monthlyUsage' key with an array of objects, each containing 'month', 'year', and 'amount' (in kWh) keys. Here are the images:\n\n${images.join('\n')}`;

    // Call Azure OpenAI API
    const response = await fetch('https://your-azure-openai-endpoint/openai/deployments/your-deployment-name/chat/completions?api-version=2023-05-15', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY!,
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1024,
            temperature: 0.7,
            stream: true,
        }),
    });

    if (!response.ok) {
        throw new Error(`Azure OpenAI API request failed: ${response.statusText}`);
    }

    const stream = OpenAIStream(response);
    const reader = stream.getReader();
    let result = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;
        result += value;
    }

    const parsedResult = JSON.parse(result);

    return parsedResult;
}

// Function to convert PDF to images
async function pdfToImages(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;
        images.push(canvas.toDataURL('image/png'));
    }

    return images;
}

export default function AddDataButton({ buildingid }: AddDataButtonProps) {
    const { updateBuilding } = useBuilding(buildingid);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button
                className="w-fit"
                startContent={<PlusIcon size={16} />}
                onPress={() => setIsModalOpen(true)}
            >
                Upload new data
            </Button>
            <UploadDataModal buildingid={buildingid} isOpen={isModalOpen} updateBuilding={updateBuilding} onClose={() => setIsModalOpen(false)} />
        </>
    );
}

interface UploadDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildingid: string;
    updateBuilding: (newData: any) => void;
}
function UploadDataModal({ isOpen, onClose, buildingid, updateBuilding }: UploadDataModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [gasFile, setGasFile] = useState<File | null>(null);
    const [electricityFile, setElectricityFile] = useState<File | null>(null);
    const [gasFileUrl, setGasFileUrl] = useState<string | null>(null);
    const [electricityFileUrl, setElectricityFileUrl] = useState<string | null>(null);
    const [extractionStatus, setExtractionStatus] = useState<'idle' | 'loading' | 'complete'>('idle');
    const [dataPreview, setDataPreview] = useState<any>(null);

    // Handle file upload
    const handleFileUpload = async (type: 'gas' | 'electricity', file: File) => {
        if (type === 'gas') {
            setGasFile(file);
            setGasFileUrl(URL.createObjectURL(file));
        } else if (type === 'electricity') {
            setElectricityFile(file);
            setElectricityFileUrl(URL.createObjectURL(file));
            const extractedData = await extractElectricityData(file);

            setDataPreview(extractedData);
        }

        setIsSubmitted(true);
    };

    // Clean up the object URLs when the component unmounts
    useEffect(() => {
        return () => {
            if (gasFileUrl) URL.revokeObjectURL(gasFileUrl);
            if (electricityFileUrl) URL.revokeObjectURL(electricityFileUrl);
        };
    }, [gasFileUrl, electricityFileUrl]);

    return (
        <Modal backdrop="blur" isOpen={isOpen} size="xl" onClose={onClose}>
            <ModalContent>
                {!isSubmitted ? (
                    <>
                        <ModalHeader>Upload New Data</ModalHeader>
                        <ModalBody>
                            <div className="flex space-x-6">
                                <div
                                    aria-label="Upload gas data"
                                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => document.getElementById('gas-upload')?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];

                                        if (file) handleFileUpload('gas', file);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            // Trigger file input click
                                        }
                                    }}
                                >
                                    <p className="text-center p-4">Click or drag to upload gas bill PDF</p>
                                    <input
                                        accept=".pdf"
                                        className="hidden"
                                        id="gas-upload"
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];

                                            if (file) handleFileUpload('gas', file);
                                        }}
                                    />
                                </div>
                                <div
                                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => document.getElementById('electricity-upload')?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];

                                        if (file) handleFileUpload('electricity', file);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            // Trigger file input click
                                        }
                                    }}
                                >
                                    <p className="text-center p-4">Click or drag to upload electricity bill PDF</p>
                                    <input
                                        accept=".pdf"
                                        className="hidden"
                                        id="electricity-upload"
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];

                                            if (file) handleFileUpload('electricity', file);
                                        }}
                                    />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter />
                    </>
                ) : (
                    <>
                        <ModalHeader>Data Uploaded</ModalHeader>
                        <ModalBody>
                            <div className="flex flex-col items-center">
                                <p className="text-4xl">
                                    ✅
                                </p>
                                <p className="text-center mt-4">
                                    Your file has been successfully uploaded! Please wait while we extract the data.
                                </p>
                                {(gasFile || electricityFile) && (
                                    <Accordion className="w-full mt-4">
                                        <AccordionItem key="1" aria-label="File Preview" title="File Preview">
                                            {gasFile && gasFileUrl && (
                                                <div>
                                                    <p>Gas Bill:</p>
                                                    <p>Name: {gasFile.name}</p>
                                                    <p>Type: {gasFile.type}</p>
                                                    <p>Size: {(gasFile.size / 1024).toFixed(2)} KB</p>
                                                    <embed
                                                        className="mt-2"
                                                        height="500px"
                                                        src={gasFileUrl}
                                                        type="application/pdf"
                                                        width="100%"
                                                    />
                                                </div>
                                            )}
                                            {electricityFile && electricityFileUrl && (
                                                <div className="mt-4">
                                                    <p>Electricity Bill:</p>
                                                    <p>Name: {electricityFile.name}</p>
                                                    <p>Type: {electricityFile.type}</p>
                                                    <p>Size: {(electricityFile.size / 1024).toFixed(2)} KB</p>
                                                    <embed
                                                        className="mt-2"
                                                        height="500px"
                                                        src={electricityFileUrl}
                                                        type="application/pdf"
                                                        width="100%"
                                                    />
                                                </div>
                                            )}
                                        </AccordionItem>
                                        <AccordionItem key="2" aria-label="Data Extraction" title="Data Extraction">
                                            {extractionStatus === 'idle' && (
                                                <Button
                                                    color="primary"
                                                    onPress={() => {
                                                        setExtractionStatus('loading');
                                                        // Simulate extraction process
                                                        setTimeout(() => {
                                                            setExtractionStatus('complete');
                                                            setDataPreview({ /* mock data */ });
                                                        }, 2000);
                                                    }}
                                                >
                                                    Start Extraction
                                                </Button>
                                            )}
                                            {extractionStatus === 'loading' && <p>Extracting data...</p>}
                                            {extractionStatus === 'complete' && <p>Extraction complete!</p>}
                                        </AccordionItem>
                                        <AccordionItem key="3" aria-label="Data Preview" title="Data Preview">
                                            {dataPreview ? (
                                                <pre>{JSON.stringify(dataPreview, null, 2)}</pre>
                                            ) : (
                                                <p>No data available. Please complete extraction first.</p>
                                            )}
                                        </AccordionItem>
                                    </Accordion>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onPress={onClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
