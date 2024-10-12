"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBuilding, WasteDataPoint } from "@/lib/useBuildingData";
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { Timestamp } from "firebase/firestore";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/table";

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewEntry(prev => ({ ...prev, [name]: value }));
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
        const updatedWasteGeneration = building.wasteGeneration.filter((_, i) => i !== index);
        updateBuilding({ wasteGeneration: updatedWasteGeneration });
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
                    <TableColumn key="emissions" onClick={() => handleSort('emissions')}>Emissions (kg CO2e)</TableColumn>
                    <TableColumn key="actions">Actions</TableColumn>
                </TableHeader>
                <TableBody>
                    {sortedWasteGeneration.map((wastePoint, index) => (
                        <TableRow key={index}>
                            <TableCell>{wastePoint.timestamp.toDate().toLocaleString()}</TableCell>
                            <TableCell>{wastePoint.wasteCategory}</TableCell>
                            <TableCell>{wastePoint.type}</TableCell>
                            <TableCell>{wastePoint.trashcanID}</TableCell>
                            <TableCell>{wastePoint.emissions.toFixed(2)}</TableCell>
                            <TableCell>
                                <Button color="danger" size="sm" onPress={() => handleDelete(index)}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Button onPress={() => setIsModalOpen(true)} className="mt-4">
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
                            type="datetime-local"
                            name="timestamp"
                            value={newEntry.timestamp}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Type"
                            name="type"
                            value={newEntry.type}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Trashcan ID"
                            name="trashcanID"
                            value={newEntry.trashcanID}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Waste Category"
                            name="wasteCategory"
                            value={newEntry.wasteCategory}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Emissions (kg CO2e)"
                            type="number"
                            name="emissions"
                            value={newEntry.emissions.toString()}
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
