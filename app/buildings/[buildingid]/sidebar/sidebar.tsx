// app/buildings/[buildingid]/sidebar/sidebar.tsx
"use client";

import { Link } from "@nextui-org/link";
import { Avatar } from "@nextui-org/avatar";
import { useState } from "react";
import { Card, Skeleton } from "@nextui-org/react";

import { useBuilding } from "@/lib/useBuildingData";


interface SidebarProps {
    buildingid: string;
}

export default function Sidebar({ buildingid }: SidebarProps) {
    const { data: buildingData, error, isLoading } = useBuilding(buildingid);
    const [isExpanded, setIsExpanded] = useState(true);

    if (isLoading) return (
        <Card className={`space-y-5 p-4 ${isExpanded ? "w-64" : "w-16"}`} radius="lg">
            <Skeleton className="rounded-lg">
                <div className="h-24 rounded-lg bg-default-300" />
            </Skeleton>
            <div className="space-y-3">
                <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-3 w-3/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-3 w-4/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-2/5 rounded-lg">
                    <div className="h-3 w-2/5 rounded-lg bg-default-300" />
                </Skeleton>
            </div>
        </Card>
    );

    if (error) return (<div>Error: {error.message}</div>);
    if (!buildingData) return (<div>No building found</div>);

    return (
        <div className={`flex flex-col items-center p-4 space-y-4 h-full ${isExpanded ? "w-64" : "w-16"}`} >
            <Avatar
                alt={buildingData.name}
                className="w-24 h-24"
                src={buildingData.imageURL}
            />
            <h2 className="text-xl font-bold">{buildingData.name}</h2>
            <nav className="flex flex-col space-y-2">
                <Link color="primary" href={`/buildings/${buildingid}/emissions`}>
                    Emissions Viewer
                </Link>
                <Link color="primary" href={`/buildings/${buildingid}/trash`}>
                    Trash Viewer
                </Link>
            </nav>
        </div >
    );
}