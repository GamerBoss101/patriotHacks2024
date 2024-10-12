// components/emissionsGraph.tsx

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

export default function EmissionsGraph({ buildingid, filters }: EmissionsGraphProps) {
    return (
        <div className="w-full h-96">Emissions graph for {buildingid}</div>
    );
}