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

        const dataMap = new Map<string, Partial<ChartDataPoint>>();

        const addDataPoint = (date: Date, type: 'electricity' | 'gas' | 'waste', value: number) => {
            const dateString = date.toISOString().split('T')[0];
            const existingData = dataMap.get(dateString) || { date: dateString };
            existingData[type] = value;
            dataMap.set(dateString, existingData);
        };

        // Collect all unique dates and data points
        const allDates = new Set<string>();
        const typedDataPoints: { [key: string]: { date: string, value: number }[] } = {
            electricity: [],
            gas: [],
            waste: []
        };

        if (filters.showElectricity) {
            building.electricityUsage.forEach((point: ElectricityDataPoint) => {
                const date = new Date(point.timestamp.seconds * 1000);
                const dateString = date.toISOString().split('T')[0];
                allDates.add(dateString);
                typedDataPoints.electricity.push({ date: dateString, value: point.emissions });
            });
        }

        if (filters.showGas) {
            building.naturalGasUsage.forEach((point: NaturalGasDataPoint) => {
                const date = new Date(point.timestamp.seconds * 1000);
                const dateString = date.toISOString().split('T')[0];
                allDates.add(dateString);
                typedDataPoints.gas.push({ date: dateString, value: point.emissions });
            });
        }

        if (filters.showWaste) {
            building.wasteGeneration.forEach((point: WasteDataPoint) => {
                const date = new Date(point.timestamp.seconds * 1000);
                const dateString = date.toISOString().split('T')[0];
                allDates.add(dateString);
                typedDataPoints.waste.push({ date: dateString, value: point.emissions });
            });
        }

        // Sort dates and data points
        const sortedDates = Array.from(allDates).sort();
        Object.values(typedDataPoints).forEach(points => points.sort((a, b) => a.date.localeCompare(b.date)));

        // Interpolate missing values
        const interpolateValue = (date: string, points: { date: string, value: number }[]) => {
            const index = points.findIndex(p => p.date >= date);
            if (index === -1) return points[points.length - 1]?.value || 0;
            if (index === 0) return points[0].value;
            const prev = points[index - 1];
            const next = points[index];
            const totalDays = (new Date(next.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
            const daysSincePrev = (new Date(date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
            return Number((prev.value + (next.value - prev.value) * (daysSincePrev / totalDays)).toFixed(3));
        };

        // Fill in all data points
        sortedDates.forEach(date => {
            const point: Partial<ChartDataPoint> = { date };
            if (filters.showElectricity) point.electricity = interpolateValue(date, typedDataPoints.electricity);
            if (filters.showGas) point.gas = interpolateValue(date, typedDataPoints.gas);
            if (filters.showWaste) point.waste = interpolateValue(date, typedDataPoints.waste);
            dataMap.set(date, point);
        });

        // Modify the return statement to truncate values
        return Array.from(dataMap.values())
            .filter(point => {
                const date = new Date(point.date || '');
                return (!filters.startDate || date >= filters.startDate) &&
                    (!filters.endDate || date <= filters.endDate);
            })
            .map(point => ({
                ...point,
                electricity: point.electricity ? Number(point.electricity.toFixed(3)) : undefined,
                gas: point.gas ? Number(point.gas.toFixed(3)) : undefined,
                waste: point.waste ? Number(point.waste.toFixed(3)) : undefined,
            }));
    }, [building, filters]);

    const pieChartData = useMemo(() => {
        if (!building || !filters.showWaste) return [];

        const wasteTypes = new Map<string, number>();

        building.wasteGeneration.forEach((point: WasteDataPoint) => {
            const type = point.wasteCategory.toLowerCase();
            wasteTypes.set(type, (wasteTypes.get(type) || 0) + point.emissions);
        });

        return Array.from(wasteTypes, ([name, value]) => ({ name, value: Number(value.toFixed(3)) }));
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
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Emissions (metric tons CO2e)', angle: -90, position: 'insideLeft', dy: 96 }} />
            <Tooltip formatter={(value) => Number(value).toFixed(3)} />
            <Legend />
            {filters.showElectricity && building && building.electricityUsage.length > 0 &&
                <Line type="monotone" dataKey="electricity" stroke="#8884d8" name="Electricity" connectNulls />}
            {filters.showGas && building && building.naturalGasUsage.length > 0 &&
                <Line type="monotone" dataKey="gas" stroke="#82ca9d" name="Natural Gas" connectNulls />}
            {filters.showWaste && building && building.wasteGeneration.length > 0 &&
                <Line type="monotone" dataKey="waste" stroke="#ffc658" name="Waste" connectNulls />}
        </LineChart>
    );

    const renderAreaChart = () => (
        <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Emissions (metric tons CO2e)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => Number(value).toFixed(3)} />
            <Legend />
            {filters.showElectricity && building && building.electricityUsage.length > 0 &&
                <Area type="monotone" dataKey="electricity" stackId="1" stroke="#8884d8" fill="#8884d8" name="Electricity" connectNulls />}
            {filters.showGas && building && building.naturalGasUsage.length > 0 &&
                <Area type="monotone" dataKey="gas" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Natural Gas" connectNulls />}
            {filters.showWaste && building && building.wasteGeneration.length > 0 &&
                <Area type="monotone" dataKey="waste" stackId="1" stroke="#ffc658" fill="#ffc658" name="Waste" connectNulls />}
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
