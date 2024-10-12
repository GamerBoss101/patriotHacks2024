// components/addDataButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";

import { PlusIcon } from "./icons";

import { useBuilding } from "@/lib/useBuildingData";

interface AddDataButtonProps {
    buildingid: string;
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

    // Add these new state variables
    const [gasFileUrl, setGasFileUrl] = useState<string | null>(null);
    const [electricityFileUrl, setElectricityFileUrl] = useState<string | null>(null);

    const handleFileUpload = async (type: 'gas' | 'electricity', file: File) => {
        if (type === 'gas') {
            setGasFile(file);
            setGasFileUrl(URL.createObjectURL(file));
        } else if (type === 'electricity') {
            setElectricityFile(file);
            setElectricityFileUrl(URL.createObjectURL(file));
        }

        setIsSubmitted(true);
    };

    // Add this useEffect to clean up the object URLs when the component unmounts
    useEffect(() => {
        return () => {
            if (gasFileUrl) URL.revokeObjectURL(gasFileUrl);
            if (electricityFileUrl) URL.revokeObjectURL(electricityFileUrl);
        };
    }, [gasFileUrl, electricityFileUrl]);

    return (
        <Modal isOpen={isOpen} size="xl" onClose={onClose}>
            <ModalContent>
                {!isSubmitted ? (
                    <>
                        <ModalHeader>Upload New Data</ModalHeader>
                        <ModalBody>
                            <div className="flex justify-between">
                                <div
                                    aria-label="Upload gas data"
                                    className="w-[45%] h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
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
                                    <p className="text-center">Click or drag to upload gas bill PDF</p>
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
                                    className="w-[45%] h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
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
                                    <p className="text-center">Click or drag to upload electricity bill PDF</p>
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
                                    Your data has been successfully uploaded!
                                </p>
                                {(gasFile || electricityFile) && (
                                    <div className="mt-4 p-4 border rounded">
                                        <h3 className="font-bold mb-2">File Preview:</h3>
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
                                    </div>
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
