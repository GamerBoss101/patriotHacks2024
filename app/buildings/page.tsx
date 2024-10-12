// app/buildings/page.tsx
"use client";
import { Card, CardHeader, CardFooter, Image, Button, Skeleton } from "@nextui-org/react";
import Link from "next/link";

import { useBuildingList } from "@/lib/useBuildingData";


export default function BuildingsPage() {
    const { data: buildings, isLoading, error } = useBuildingList();

    if (isLoading) return (
        <div className="grid grid-cols-12 gap-4 p-4">
            {[...Array(2)].map((_, index) => (
                <Card key={index} className="w-full h-[300px] col-span-12 sm:col-span-6 md:col-span-4">
                    <Skeleton className="rounded-lg">
                        <div className="h-[300px]" />
                    </Skeleton>
                </Card>
            ))}
        </div>
    );
    if (error) return <div>Error: {error.message}</div>;

    if (buildings) return (
        <div className="grid grid-cols-12 gap-4 p-4">
            {buildings.map(building => (
                <Card
                    key={building.id}
                    isFooterBlurred
                    className="w-full h-[300px] col-span-12 sm:col-span-6 md:col-span-4"
                >
                    <CardHeader className="absolute z-10 top-1 flex-col items-start bg-gray-800/5 backdrop-blur-lg rounded-none -mt-1">
                        <h4 className="text-white font-medium text-2xl">{building.name}</h4>
                        <p className="text-white/60 text-small">{building.address}</p>
                    </CardHeader>
                    <Image
                        removeWrapper
                        alt={`${building.name} image`}
                        className="z-0 w-full h-full object-cover"
                        src={building.imageURL}
                    />
                    <CardFooter className="absolute bg-black/40 bottom-0 z-10 justify-between">
                        <div>
                            <p className="text-white text-tiny">Year Built: {building.yearBuilt}</p>
                            <p className="text-white text-tiny">Square Footage: {building.squareFootage}</p>
                        </div>
                        <Link href={`/buildings/${building.id}`}>
                            <Button className="text-tiny" color="primary" radius="full" size="sm">
                                View Building
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    return <div>No buildings found</div>;
}
