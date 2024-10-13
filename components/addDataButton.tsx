// components/addDataButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@nextui-org/react";

import { PlusIcon } from "./icons";
import { UploadDataModal } from "./uploadDataModal";

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
            <UploadDataModal
                buildingid={buildingid}
                isOpen={isModalOpen}
                updateBuilding={updateBuilding}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}