// app/buildings/[buildingid]/sidebar/sidebar.tsx
"use client";

import { Link } from "@nextui-org/link";
import { Avatar } from "@nextui-org/avatar";
import { useState } from "react";
import { Button, Skeleton } from "@nextui-org/react";

import { ThemeSwitch } from "../theme-switch";

import { useBuilding } from "@/lib/useBuildingData";
import { GithubIcon, LeftArrowIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";


interface SidebarProps {
    buildingid: string;
}

export default function Sidebar({ buildingid }: SidebarProps) {
    const { data: buildingData, error, isLoading } = useBuilding(buildingid);
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={`flex flex-col items-center p-4 space-y-4 h-full ${isExpanded ? "w-64" : "w-16"}`}>

            {/* Top section with info about building */}
            <div className="flex flex-col items-center space-y-4 min-h-64 max-h-64">

                {/* Back to all buildings */}
                <Link href="/buildings">
                    <Button startContent={<LeftArrowIcon size={16} />} variant="light">
                        {"Back to all buildings"}
                    </Button>
                </Link>

                {/* Photo of building */}
                {isLoading ? (
                    <Skeleton className="w-24 h-24 rounded-full">
                        <div className="w-24 h-24 rounded-full bg-default-300" />
                    </Skeleton>
                ) : error ? (
                    <div>Error: {error.message}</div>
                ) : !buildingData ? (
                    <div>No building found</div>
                ) : (
                    <Avatar
                        alt={buildingData.name}
                        className="w-24 h-24"
                        src={buildingData.imageURL}
                    />
                )}

                {/* Name of building */}
                {isLoading ? (
                    <Skeleton className="w-40 h-8 mb-4">
                        <div className="w-40 h-8 bg-default-300" />
                    </Skeleton>
                ) : buildingData ? (
                    <h2 className="text-xl font-bold mb-4">{buildingData.name}</h2>
                ) : null}
            </div>

            {/* Middle section with navigation links */}
            <nav className="flex flex-col space-y-6 h-full">
                <Link color="primary" href={`/buildings/${buildingid}`}>
                    Overview
                </Link>
                <Link color="primary" href={`/buildings/${buildingid}/emissions`}>
                    Emissions
                </Link>
                <Link color="primary" href={`/buildings/${buildingid}/trash`}>
                    Trash
                </Link>
            </nav>

            {/* Bottom section with quick actions */}
            <div className="flex items-center space-x-2 bg-default-100 rounded-full p-2">
                <ThemeSwitch />
                <div className="w-px h-6 bg-divider" /> {/* Vertical divider */}
                <Link isExternal aria-label="Github" className="p-0" href={siteConfig.links.github}>
                    <GithubIcon className="text-default-500" />
                </Link>
            </div>
        </div>
    );
}
