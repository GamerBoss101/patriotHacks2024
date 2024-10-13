"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { Timestamp } from "firebase/firestore";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/table";
import { Select, SelectItem } from "@nextui-org/react";

import { useBuilding, WasteDataPoint } from "@/lib/useBuildingData";
import { trashItems } from "@/components/trashcanMode";

export default function TrashPage() {
    const { buildingid } = useParams();
    const { data: building, isLoading, error, updateBuilding } = useBuilding(buildingid as string);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEntry, setNewEntry] = useState({
        timestamp: new Date().toISOString().slice(0, 16),
        type: "",
        trashcanID: "",
        wasteCategory: "",
        emissions: 0,
    });
    const [sortConfig, setSortConfig] = useState<{ key: keyof WasteDataPoint; direction: 'ascending' | 'descending' } | null>(null);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!building) return <div>Building not found</div>;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'emissions') {
            const inputValue = parseFloat(value);
            const scaledValue = isNaN(inputValue) ? 0 : inputValue / 1e+3;

            setNewEntry(prev => ({ ...prev, [name]: scaledValue }));
        } else {
            setNewEntry(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = () => {
        const updatedWasteGeneration = [
            ...building!.wasteGeneration,
            { ...newEntry, timestamp: Timestamp.fromDate(new Date(newEntry.timestamp)), emissions: Number(newEntry.emissions) }
        ];

        updateBuilding({ wasteGeneration: updatedWasteGeneration as WasteDataPoint[] });
        setIsModalOpen(false);
    };

    const handleSort = (key: keyof WasteDataPoint) => {
        let direction: 'ascending' | 'descending' = 'ascending';

        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedWasteGeneration = [...building.wasteGeneration].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;

        return 0;
    });

    const handleDelete = (index: number) => {
        updateBuilding({ operation: 'deleteWasteEntry', index });
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Waste Data for {building?.name}</h1>
            <Table aria-label="Waste data table">
                <TableHeader>
                    <TableColumn key="timestamp" onClick={() => handleSort('timestamp')}>Timestamp</TableColumn>
                    <TableColumn key="wasteCategory" onClick={() => handleSort('wasteCategory')}>Name</TableColumn>
                    <TableColumn key="type" onClick={() => handleSort('type')}>Trash Category</TableColumn>
                    <TableColumn key="trashcanID" onClick={() => handleSort('trashcanID')}>Trashcan ID</TableColumn>
                    <TableColumn key="emissions" onClick={() => handleSort('emissions')}>Emissions (kg ofCO2e)</TableColumn>
                    <TableColumn key="actions">Actions</TableColumn>
                </TableHeader>
                <TableBody>
                    {sortedWasteGeneration.map((wastePoint, index) => (
                        <TableRow key={index}>
                            <TableCell>{new Date(wastePoint.timestamp.seconds * 1000).toLocaleString()}</TableCell>
                            <TableCell>{wastePoint.wasteCategory}</TableCell>
                            <TableCell>{wastePoint.type}</TableCell>
                            <TableCell>{wastePoint.trashcanID}</TableCell>
                            <TableCell>{(wastePoint.emissions * 1e+3).toFixed(0)}</TableCell>
                            <TableCell>
                                <Button color="danger" size="sm" onPress={() => handleDelete(index)}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Button className="mt-4" onPress={() => setIsModalOpen(true)}>
                Add New Entry
            </Button>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>
                        <h2 className="text-lg font-semibold">Add New Waste Entry</h2>
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            label="Timestamp"
                            name="timestamp"
                            type="datetime-local"
                            value={newEntry.timestamp}
                            onChange={handleInputChange}
                        />
                        <Select
                            className="w-full"
                            label="Type"
                            name="type"
                            selectedKeys={[newEntry.type]}
                            onChange={handleInputChange}
                        >
                            {trashItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </Select>
                        <Input
                            label="Trashcan ID"
                            name="trashcanID"
                            value={newEntry.trashcanID}
                            onChange={handleInputChange}
                        />
                        <Select
                            label="Waste Category"
                            name="wasteCategory"
                            selectedKeys={[newEntry.wasteCategory]}
                            onChange={handleInputChange}
                        >
                            <SelectItem key="Landfill" value="Landfill">
                                Landfill
                            </SelectItem>
                            <SelectItem key="Recycling" value="Recycling">
                                Recycling
                            </SelectItem>
                            <SelectItem key="Compost" value="Compost">
                                Compost
                            </SelectItem>
                        </Select>
                        <Input
                            label="Emissions (grams of CO2e)"
                            name="emissions"
                            type="number"
                            value={(newEntry.emissions * 1e+3).toString()} // Multiply by 1e+3 for display
                            onChange={handleInputChange}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            Add Entry
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
