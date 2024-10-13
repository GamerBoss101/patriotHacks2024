// app/buildings/[buildingid]/layout.tsx
import Sidebar from "../../../components/sidebar";

export default function BuildingLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { buildingid: string };
}) {
    return (
        <div className="flex h-screen w-full">
            <Sidebar buildingid={params.buildingid} />
            <main className="flex-1 max-h-screen overflow-y-auto">{children}</main>
        </div>
    );
}
