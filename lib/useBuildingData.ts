// lib/useBuildingData.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type ElectricityDataPoint = {
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
    kwh: number;
    emissions: number;
};

export type NaturalGasDataPoint = {
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
    therms: number;
    emissions: number;
};

export type WasteDataPoint = {
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
    type: string;
    trashcanID: string;
    wasteCategory: string;
    emissions: number;
};

export type Building = {
    name: string;
    id: string;
    address: string;
    yearBuilt: number;
    squareFeet: number;
    imageURL: string;
    electricityUsage: Array<ElectricityDataPoint>;
    naturalGasUsage: Array<NaturalGasDataPoint>;
    wasteGeneration: Array<WasteDataPoint>;
}

const getBuildingsFromAPI = async () => {
    const response = await fetch('/api/buildings');

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
}

const updateBuildingInAPI = async (buildingId: string, newData: Partial<Building> & { operation?: string; index?: number }) => {
    const response = await fetch('/api/buildings', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: buildingId, ...newData }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
    }
    return response.json();
}

export function useBuildingList() {
    const query = useQuery<Building[], Error>({
        queryKey: ['buildings'],
        queryFn: getBuildingsFromAPI,
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    });

    return {
        ...query,
    };
}

export function useBuilding(buildingId: string) {
    const queryClient = useQueryClient();

    const query = useQuery<Building, Error>({
        queryKey: ['building', buildingId],
        queryFn: () => getBuildingFromAPI(buildingId),
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    });

    const mutation = useMutation({
        mutationFn: (data: Partial<Building> & { operation?: string; index?: number }) => updateBuildingInAPI(buildingId, data),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['building', buildingId] });
            const previousBuilding = queryClient.getQueryData<Building>(['building', buildingId]);

            queryClient.setQueryData<Building>(['building', buildingId], (oldData) => {
                if (!oldData) return undefined;

                if (data.operation === 'deleteWasteEntry' && typeof data.index === 'number') {
                    const newWasteGeneration = [...oldData.wasteGeneration];
                    newWasteGeneration.splice(data.index, 1);
                    return { ...oldData, wasteGeneration: newWasteGeneration };
                }

                return { ...oldData, ...data };
            });

            return { previousBuilding };
        },
        onError: (err, newData, context) => {
            console.error("Error updating building data:", err);
            // Log additional details about the failed update
            console.error("Failed update data:", newData);
            queryClient.setQueryData(['building', buildingId], context!.previousBuilding);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
        }
    });

    return {
        ...query,
        updateBuilding: mutation.mutate
    };
}

const getBuildingFromAPI = async (buildingId: string): Promise<Building> => {
    const response = await fetch(`/api/buildings?id=${buildingId}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}
