// components/uploadDataModal.tsx

import { useState, useEffect } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { useRouter } from 'next/navigation';

import { ElectricityDataPoint, NaturalGasDataPoint } from "../lib/useBuildingData";

interface UploadDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildingid: string;
    updateBuilding: (newData: any) => void;
}

const EMISSIONS_FACTOR = 0.5;
const key = process.env.NEXT_PUBLIC_FORM_RECOGNIZER_KEY;
const endpoint = process.env.NEXT_PUBLIC_FORM_RECOGNIZER_ENDPOINT;

export function UploadDataModal({ isOpen, onClose, buildingid, updateBuilding }: UploadDataModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [gasFile, setGasFile] = useState<File | null>(null);
    const [electricityFile, setElectricityFile] = useState<File | null>(null);
    const [gasFileUrl, setGasFileUrl] = useState<string | null>(null);
    const [electricityFileUrl, setElectricityFileUrl] = useState<string | null>(null);
    const [extractionStatus, setExtractionStatus] = useState<'idle' | 'loading' | 'complete'>('idle');
    const [aiExtractionStatus, setAiExtractionStatus] = useState<'idle' | 'loading' | 'complete'>('idle');
    const [dataPreview, setDataPreview] = useState<any>(null);
    const router = useRouter();

    const handleFileUpload = (type: 'gas' | 'electricity', file: File) => {
        if (type === 'gas') {
            setGasFile(file);
            setGasFileUrl(URL.createObjectURL(file));
        } else if (type === 'electricity') {
            setElectricityFile(file);
            setElectricityFileUrl(URL.createObjectURL(file));
        }
        setIsSubmitted(true);
    };

    useEffect(() => {
        return () => {
            if (gasFileUrl) URL.revokeObjectURL(gasFileUrl);
            if (electricityFileUrl) URL.revokeObjectURL(electricityFileUrl);
        };
    }, [gasFileUrl, electricityFileUrl]);

    const extractDataFromPDF = async (file: File, type: 'gas' | 'electricity') => {
        const client = new DocumentAnalysisClient(endpoint!, new AzureKeyCredential(key!));

        const arrayBuffer = await file.arrayBuffer();
        const poller = await client.beginAnalyzeDocument("prebuilt-document", arrayBuffer);
        const { keyValuePairs } = await poller.pollUntilDone();

        if (!keyValuePairs) return [];

        const dataPoints: (ElectricityDataPoint | NaturalGasDataPoint)[] = [];
        let extractedDate: Date | null = null;

        const monthMap: { [key: string]: number } = {
            'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
            'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
            'aug': 7, 'august': 7, 'sep': 8, 'september': 8, 'oct': 9, 'october': 9,
            'nov': 10, 'november': 10, 'dec': 11, 'december': 11
        };

        for (const { key, value } of keyValuePairs) {
            console.log("KEY:", key.content, "VALUE:", value?.content);
            if (!value) continue;

            const keyLower = key.content.toLowerCase();
            const valueLower = value.content.toLowerCase();

            // Extract date information
            if (keyLower.includes('date') || keyLower.includes('period')) {
                console.log("DATE IDENTIFIED:", valueLower);
                const dateMatch = valueLower.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:of)?\s*([a-z]+)?\s*(\d{4})?/i);

                console.log("DATE MATCH:", dateMatch);

                if (dateMatch) {
                    const day = 1; // Always assume 1st of the month
                    const month = dateMatch[2] ? monthMap[dateMatch[2].toLowerCase()] : new Date().getMonth();
                    const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();

                    if (year >= 1900 && year <= 2100) {
                        extractedDate = new Date(year, month, day);
                    }
                }
            }

            if (type === 'electricity' && keyLower.includes('kwh')) {
                const kwh = parseFloat(value.content || '0');

                if (kwh !== 0) {
                    const timestamp = extractedDate || new Date();

                    timestamp.setHours(0, 0, 0, 0); // Set to midnight

                    const existingDataIndex = dataPoints.findIndex(point =>
                        point.timestamp.seconds === timestamp.getTime() / 1000
                    );

                    if (existingDataIndex === -1) {
                        dataPoints.push({
                            timestamp: { seconds: timestamp.getTime() / 1000, nanoseconds: 0 },
                            kwh: kwh,
                            emissions: kwh * EMISSIONS_FACTOR / 1000,
                        });
                    } else {
                        dataPoints[existingDataIndex] = {
                            ...dataPoints[existingDataIndex],
                            kwh: kwh,
                            emissions: kwh * EMISSIONS_FACTOR / 1000,
                        };
                    }
                }
            } else if (type === 'gas' && keyLower.includes('therm')) {
                const therms = parseFloat(value.content || '0');

                if (therms !== 0) {
                    const timestamp = extractedDate || new Date();

                    timestamp.setHours(0, 0, 0, 0); // Set to midnight

                    const existingDataIndex = dataPoints.findIndex(point =>
                        point.timestamp.seconds === timestamp.getTime() / 1000
                    );

                    if (existingDataIndex === -1) {
                        dataPoints.push({
                            timestamp: { seconds: timestamp.getTime() / 1000, nanoseconds: 0 },
                            therms: therms,
                            emissions: therms * 5.3 / 1000, // approx CO2 emissions for natural gas (5.3 kg CO2 per therm, measured in tons)
                        });
                    } else {
                        dataPoints[existingDataIndex] = {
                            ...dataPoints[existingDataIndex],
                            therms: therms,
                            emissions: therms * 5.3 / 1000,
                        };
                    }
                }
            }
        }

        return dataPoints;
    };

    const handleExtraction = async () => {
        setExtractionStatus('loading');
        try {
            let newData: any = {};

            if (gasFile) {
                const gasData = await extractDataFromPDF(gasFile, 'gas');

                console.log("Gas data:");
                gasData.forEach(dataPoint => {
                    console.log("Date:", new Date(dataPoint.timestamp.seconds * 1000).toLocaleDateString(), "Therms:", (dataPoint as NaturalGasDataPoint).therms);
                });
                newData.naturalGasUsage = gasData;
            }

            if (electricityFile) {
                const electricityData = await extractDataFromPDF(electricityFile, 'electricity');

                console.log("Electricity data:");
                electricityData.forEach(dataPoint => {
                    console.log("Date:", new Date(dataPoint.timestamp.seconds * 1000).toLocaleDateString(), "kWh:", (dataPoint as ElectricityDataPoint).kwh);
                });
                newData.electricityUsage = electricityData;
            }

            setDataPreview(newData);
            setExtractionStatus('complete');

            // Update the building data
            updateBuilding(newData);
        } catch (error) {
            console.error("Error during extraction:", error);
            setExtractionStatus('idle');
        }
    };

    const handleAIExtraction = async () => {
        setAiExtractionStatus('loading');
        try {
            let newData: any = {};

            if (gasFile) {
                const gasData = await extractDataUsingAI(gasFile, 'gas');
                newData.naturalGasUsage = gasData;
            }

            if (electricityFile) {
                const electricityData = await extractDataUsingAI(electricityFile, 'electricity');
                newData.electricityUsage = electricityData;
            }

            setDataPreview(newData);
            setAiExtractionStatus('complete');

            // Update the building data
            updateBuilding(newData);
        } catch (error) {
            console.error("Error during AI extraction:", error);
            setAiExtractionStatus('idle');
        }
    };

    const extractDataUsingAI = async (file: File, type: 'gas' | 'electricity') => {
        // Step 1: Convert PDF to image
        const formData = new FormData();

        formData.append('pdf', file, file.name);
        formData.append('type', type);

        const pdfToImageResponse = await fetch('/api/pdf-to-image', {
            method: 'POST',
            body: formData,
        });

        if (!pdfToImageResponse.ok) {
            throw new Error('Failed to convert PDF to image');
        }

        const { response } = await pdfToImageResponse.json();
        console.log("PDF TO IMAGE RESPONSE", response);

        // Parse the JSON response
        const parsedData: string = response.response;

        //Trim the string to remove the "anything before first {" and "and after last }"
        const trimmedData = parsedData.replace(/^[^{]*|[^}]*$/g, '');

        const parsedTrimmedData = JSON.parse(trimmedData);
        console.log("PARSED TRIMMED DATA", parsedTrimmedData);

        // Convert the parsed data to the format expected by the application
        return parsedTrimmedData.dataPoints.map((point: any) => ({
            timestamp: {
                seconds: new Date(point.date).getTime() / 1000,
                nanoseconds: 0
            },
            [type === 'gas' ? 'therms' : 'kwh']: point.usage,
            emissions: point.usage * (type === 'gas' ? 5.3 : EMISSIONS_FACTOR) / 1000,
        }));
    };

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
                                        if ((e.key === 'Enter' || e.key === ' ') && gasFile) {
                                            e.preventDefault();
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
                                        if ((e.key === 'Enter' || e.key === ' ') && electricityFile) {
                                            e.preventDefault();
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
                                <p className="text-4xl">✅</p>
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
                                            {extractionStatus === 'idle' && aiExtractionStatus === 'idle' && (
                                                <div className="flex space-x-4">
                                                    <Button
                                                        color="primary"
                                                        onPress={handleExtraction}
                                                    >
                                                        Start Form Recognizer Extraction
                                                    </Button>
                                                    <Button
                                                        color="secondary"
                                                        onPress={handleAIExtraction}
                                                    >
                                                        Start AI-Powered Extraction
                                                    </Button>
                                                </div>
                                            )}
                                            {extractionStatus === 'loading' && <p>Extracting data using Form Recognizer...</p>}
                                            {aiExtractionStatus === 'loading' && <p>Extracting data using AI...</p>}
                                            {extractionStatus === 'complete' && <p>Form Recognizer extraction complete!</p>}
                                            {aiExtractionStatus === 'complete' && <p>AI-powered extraction complete!</p>}
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