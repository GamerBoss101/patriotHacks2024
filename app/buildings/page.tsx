// app/buildings/page.tsx
"use client";
import { useBuildingData } from "@/lib/useBuildingData";

export default function BuildingsPage() {
    const { data: buildings, isLoading, error } = useBuildingData();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    if (buildings) return (
        <div>
            {buildings.map(building => (
                <div key={building.id}>{building.name}</div>
            ))}
        </div>
    );

    return <div>No buildings found</div>;
}
