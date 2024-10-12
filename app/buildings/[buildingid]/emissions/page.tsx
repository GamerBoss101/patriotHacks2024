// app/buildings/[buildingid]/emissions/page.tsx
"use client";

import { useState } from "react";

import EmissionsGraph from "@/components/emissionsGraph";
import { useBuilding } from "@/lib/useBuildingData";
import { Button } from "@nextui-org/button";
import AddDataButton from "@/components/addDataButton";

interface EmissionsPageProps {
    params: { buildingid: string };
}

export default function EmissionsPage({ params }: EmissionsPageProps) {
    const { data: buildingData } = useBuilding(params.buildingid);

    // State for filters
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showWaste, setShowWaste] = useState(false);
    const [showElectricity, setShowElectricity] = useState(false);
    const [showGas, setShowGas] = useState(false);

    return (
        <div className="flex flex-col items-center h-full p-4">

            {/* Tab Title */}
            <h1 className="text-6xl text-left self-start font-bold">
                {`Emissions`}
            </h1>

            {/* Group for filters plus graph */}
            <div className="flex flex-col justify-center w-full h-full">

                {/* Horizontal group for adding data and filters */}
                <AddDataButton buildingid={params.buildingid} />

                {/* Render emissions graph */}
                <EmissionsGraph buildingid={params.buildingid} filters={{ startDate, endDate, showWaste, showElectricity, showGas }} />
            </div>
        </div>
    );
}