// components/emissionsGraph.tsx

import React, { useMemo } from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useBuilding, Building, ElectricityDataPoint, NaturalGasDataPoint, WasteDataPoint } from '@/lib/useBuildingData';

export type EmissionGraphFilters = {
    startDate?: Date | null;
    endDate?: Date | null;
    showWaste?: boolean;
    showElectricity?: boolean;
    showGas?: boolean;
}

interface EmissionsGraphProps {
    buildingid: string;
    filters: EmissionGraphFilters;
}

type ChartDataPoint = {
    date: string;
    electricity: number;
    gas: number;
    waste: number;
};

export default function EmissionsGraph({ buildingid, filters }: EmissionsGraphProps) {
    const { data: building, isLoading, error } = useBuilding(buildingid);

    const chartData = useMemo(() => {
        if (!building) return [];

        const dataMap = new Map<string, ChartDataPoint>();

        const addDataPoint = (date: Date, type: 'electricity' | 'gas' | 'waste', value: number) => {
            const dateString = date.toISOString().split('T')[0];
            const existingData = dataMap.get(dateString) || { date: dateString, electricity: 0, gas: 0, waste: 0 };
            existingData[type] += value;
            dataMap.set(dateString, existingData);
        };

        if (filters.showElectricity) {
            building.electricityUsage.forEach((point: ElectricityDataPoint) => {
                addDataPoint(new Date(point.timestamp.seconds * 1000), 'electricity', point.emissions);
            });
        }

        if (filters.showGas) {
            building.naturalGasUsage.forEach((point: NaturalGasDataPoint) => {
                addDataPoint(new Date(point.timestamp.seconds * 1000), 'gas', point.emissions);
            });
        }

        if (filters.showWaste) {
            building.wasteGeneration.forEach((point: WasteDataPoint) => {
                addDataPoint(new Date(point.timestamp.seconds * 1000), 'waste', point.emissions);
            });
        }

        return Array.from(dataMap.values())
            .filter(point => {
                const date = new Date(point.date);
                return (!filters.startDate || date >= filters.startDate) &&
                    (!filters.endDate || date <= filters.endDate);
            })
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [building, filters]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                    />
                    <YAxis
                        label={{ value: 'Emissions (kg CO2e)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    {filters.showElectricity && building && building.electricityUsage.length > 0 && <Line type="monotone" dataKey="electricity" stroke="#8884d8" name="Electricity" />}
                    {filters.showGas && building && building.naturalGasUsage.length > 0 && <Line type="monotone" dataKey="gas" stroke="#82ca9d" name="Natural Gas" />}
                    {filters.showWaste && building && building.wasteGeneration.length > 0 && <Line type="monotone" dataKey="waste" stroke="#ffc658" name="Waste" />}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
