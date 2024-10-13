// app/buildings/[buildingid]/emissions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { CalendarDate } from "@internationalized/date";

import EmissionsGraph from "@/components/emissionsGraph";
import { useBuilding } from "@/lib/useBuildingData";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import AddDataButton from "@/components/addDataButton";
import { ButtonGroup } from "@nextui-org/button";
import { Card, CardHeader, CardBody } from "@nextui-org/react";
import { Input } from "@nextui-org/input";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Calendar, DateValue } from "@nextui-org/calendar";

interface EmissionsPageProps {
    params: { buildingid: string };
}

export default function EmissionsPage({ params }: EmissionsPageProps) {
    const { data: buildingData } = useBuilding(params.buildingid);

    // State for filters
    const [startDate, setStartDate] = useState<DateValue | null>(null);
    const [endDate, setEndDate] = useState<DateValue | null>(null);
    const [showWaste, setShowWaste] = useState(true);
    const [showElectricity, setShowElectricity] = useState(true);
    const [showGas, setShowGas] = useState(true);
    const [graphType, setGraphType] = useState<'line' | 'area' | 'pie'>('line');

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

                setStartDate(new CalendarDate(earliestDate.getFullYear(), earliestDate.getMonth() + 1, earliestDate.getDate()));
                setEndDate(new CalendarDate(latestDate.getFullYear(), latestDate.getMonth() + 1, latestDate.getDate()));
            }
        }
    }, [buildingData]);

    const handlePdfToImage = async () => {
        try {
            const formData = new FormData();
            const pdfResponse = await fetch('/electricity-sample-bill.pdf');
            const pdfBlob = await pdfResponse.blob();
            formData.append('pdf', pdfBlob, 'electricity-sample-bill.pdf');

            const response = await fetch('/api/pdf-to-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to convert PDF to image');
            }

            const result = await response.json();
            console.log('PDF to Image conversion result:', result);
            // Handle the result as needed
        } catch (error) {
            console.error('Error converting PDF to image:', error);
            // Handle the error (e.g., show an error message to the user)
        }
    };

    const handleStartDateChange = (date: DateValue) => {
        setStartDate(date);
    };

    const handleEndDateChange = (date: DateValue) => {
        setEndDate(date);
    };

    return (
        <div className="flex flex-col items-center h-full p-4">

            {/* Tab Title */}
            <h1 className="text-6xl text-left self-start font-bold mb-3">
                {`Emissions`}
            </h1>

            {/* Group for filters plus graph */}
            <div className="flex flex-col justify-center w-full h-full">
                {/* Horizontal group for adding data and filters */}
                <AddDataButton buildingid={params.buildingid} />

                <div className="flex gap-4 mt-4">
                    {/* Data Type Selection Card */}
                    <Card className="flex-1">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Data Types</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="flex gap-2">
                                <Button
                                    color={showElectricity ? "primary" : "default"}
                                    onClick={() => setShowElectricity(!showElectricity)}
                                >
                                    Electricity
                                </Button>
                                <Button
                                    color={showGas ? "primary" : "default"}
                                    onClick={() => setShowGas(!showGas)}
                                >
                                    Natural Gas
                                </Button>
                                <Button
                                    color={showWaste ? "primary" : "default"}
                                    onClick={() => setShowWaste(!showWaste)}
                                >
                                    Waste
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Chart Type Selection Card */}
                    <Card className="flex-1">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Chart Type</h3>
                        </CardHeader>
                        <CardBody>
                            <ButtonGroup>
                                <Button
                                    color={graphType === 'line' ? "primary" : "default"}
                                    onClick={() => setGraphType('line')}
                                >
                                    Line
                                </Button>
                                <Button
                                    color={graphType === 'area' ? "primary" : "default"}
                                    onClick={() => setGraphType('area')}
                                >
                                    Area
                                </Button>
                                <Button
                                    color={graphType === 'pie' ? "primary" : "default"}
                                    onClick={() => setGraphType('pie')}
                                >
                                    Pie
                                </Button>
                            </ButtonGroup>
                        </CardBody>
                    </Card>

                    {/* Date Range Selection Card */}
                    <Card className="flex-1">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Date Range</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="flex gap-2">
                                <Popover placement="bottom">
                                    <PopoverTrigger>
                                        <Input
                                            label="Start Date"
                                            value={startDate ? startDate.toString() : ''}
                                            readOnly
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <Calendar
                                            value={startDate}
                                            onChange={handleStartDateChange}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Popover placement="bottom">
                                    <PopoverTrigger>
                                        <Input
                                            label="End Date"
                                            value={endDate ? endDate.toString() : ''}
                                            readOnly
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <Calendar
                                            value={endDate}
                                            onChange={handleEndDateChange}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Divider className="mt-6" />

                {/* Render emissions graph */}
                <EmissionsGraph
                    buildingid={params.buildingid}
                    filters={{ startDate: startDate ? startDate.toDate('UTC') : null, endDate: endDate ? endDate.toDate('UTC') : null, showWaste, showElectricity, showGas }}
                    graphType={graphType}
                />
            </div>
        </div>
    );
}
