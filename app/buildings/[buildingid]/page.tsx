// app/buildings/[buildingid]/page.tsx

interface BuildingPageProps {
    params: { buildingid: string };
}

export default function BuildingPage({ params }: BuildingPageProps) {
    return (
        <div className="flex items-center justify-center text-center h-full">
            Select a tab to view information about this building.
        </div>
    );
}
