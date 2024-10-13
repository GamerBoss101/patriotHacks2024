// components/emissionsGraph.tsx

import React, { useMemo } from 'react';

import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    graphType: 'line' | 'area' | 'pie';
}

type ChartDataPoint = {
    date: string;
    electricity: number;
    gas: number;
    waste: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EmissionsGraph({ buildingid, filters, graphType }: EmissionsGraphProps) {
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

    const pieChartData = useMemo(() => {
        if (!building || !filters.showWaste) return [];

        const wasteTypes = new Map<string, number>();

        building.wasteGeneration.forEach((point: WasteDataPoint) => {
            const type = point.wasteCategory.toLowerCase();
            wasteTypes.set(type, (wasteTypes.get(type) || 0) + point.emissions);
        });

        return Array.from(wasteTypes, ([name, value]) => ({ name, value }));
    }, [building, filters.showWaste]);

    if (isLoading) {
        return (
            <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg">
                {/* Skeleton content */}
                <div className="h-full flex items-center justify-center">
                    <span className="text-gray-400">Loading...</span>
                </div>
            </div>
        );
    }
    if (error) return <div>Error: {error.message}</div>;

    const renderLineChart = () => (
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
    );

    const renderAreaChart = () => (
        <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="date"
            />
            <YAxis
                label={{ value: 'Emissions (kg CO2e)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            {filters.showElectricity && building && building.electricityUsage.length > 0 && <Area type="monotone" dataKey="electricity" stackId="1" stroke="#8884d8" fill="#8884d8" name="Electricity" />}
            {filters.showGas && building && building.naturalGasUsage.length > 0 && <Area type="monotone" dataKey="gas" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Natural Gas" />}
            {filters.showWaste && building && building.wasteGeneration.length > 0 && <Area type="monotone" dataKey="waste" stackId="1" stroke="#ffc658" fill="#ffc658" name="Waste" />}
        </AreaChart>
    );

    const renderPieChart = () => (
        <PieChart>
            <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
                {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip />
            <Legend />
        </PieChart>
    );

    return (
        <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
                {(() => {
                    switch (graphType) {
                        case 'line':
                            return renderLineChart();
                        case 'area':
                            return renderAreaChart();
                        case 'pie':
                            return renderPieChart();
                        default:
                            return <></>;
                    }
                })()}
            </ResponsiveContainer>
        </div>
    );
}
