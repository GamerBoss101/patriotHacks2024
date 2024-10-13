// app/buildings/[buildingid]/emissions/page.tsx
"use client";

import { useState, useEffect } from "react";

import EmissionsGraph from "@/components/emissionsGraph";
import { useBuilding } from "@/lib/useBuildingData";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import AddDataButton from "@/components/addDataButton";
import RealtimeModel from "@/components/trashDetection";

interface EmissionsPageProps {
    params: { buildingid: string };
}

export default function EmissionsPage({ params }: EmissionsPageProps) {
    const { data: buildingData } = useBuilding(params.buildingid);

    // State for filters
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showWaste, setShowWaste] = useState(true);
    const [showElectricity, setShowElectricity] = useState(true);
    const [showGas, setShowGas] = useState(true);

    useEffect(() => {
        if (buildingData) {
            const allDates = [
                ...buildingData.electricityUsage.map(d => d.timestamp),
                ...buildingData.naturalGasUsage.map(d => d.timestamp),
                ...buildingData.wasteGeneration.map(d => d.timestamp)
            ];

            if (allDates.length > 0) {
                const earliestDate = new Date(Math.min(...allDates.map(d => (d as any).seconds * 1000)));
                const latestDate = new Date(Math.max(...allDates.map(d => (d as any).seconds * 1000)));

                earliestDate.setDate(earliestDate.getDate() - 1);
                latestDate.setDate(latestDate.getDate() + 1);

                setStartDate(earliestDate);
                setEndDate(latestDate);
            }
        }
    }, [buildingData]);

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

                <Divider className="mb-6 mt-16" />

                {/* Render emissions graph */}
                <EmissionsGraph
                    buildingid={params.buildingid}
                    filters={{ startDate, endDate, showWaste, showElectricity, showGas }}
                />
            </div>
        </div>
    );
}
