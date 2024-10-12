// app/buildings/[buildingid]/page.tsx

interface BuildingPageProps {
    params: { buildingid: string };
}

export default function BuildingPage({ params }: BuildingPageProps) {
    return (
        <div className="">
            Building content will go here
        </div>
    );
}