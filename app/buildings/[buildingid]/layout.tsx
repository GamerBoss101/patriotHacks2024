// app/buildings/[buildingid]/layout.tsx
import Sidebar from "./sidebar/sidebar";

export default function BuildingLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { buildingid: string };
}) {
    return (
        <div className="flex h-screen w-full -pt-16 mt-0">
            <Sidebar buildingid={params.buildingid} />
            <main className="flex-1">{children}</main>
        </div>
    );
}
