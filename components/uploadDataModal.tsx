// components/uploadDataModal.tsx

import { useState, useEffect } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { Accordion, AccordionItem } from "@nextui-org/react";

interface UploadDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildingid: string;
    updateBuilding: (newData: any) => void;
}

export function UploadDataModal({ isOpen, onClose, buildingid, updateBuilding }: UploadDataModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [gasFile, setGasFile] = useState<File | null>(null);
    const [electricityFile, setElectricityFile] = useState<File | null>(null);
    const [gasFileUrl, setGasFileUrl] = useState<string | null>(null);
    const [electricityFileUrl, setElectricityFileUrl] = useState<string | null>(null);
    const [extractionStatus, setExtractionStatus] = useState<'idle' | 'loading' | 'complete'>('idle');
    const [dataPreview, setDataPreview] = useState<any>(null);

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
                                            {extractionStatus === 'idle' && (
                                                <Button
                                                    color="primary"
                                                    onPress={() => {
                                                        setExtractionStatus('loading');
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
