// lib/useBuildingData.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export type ElectricityDataPoint = {
    timestamp: Date;
    kwh: number;
    emissions: number;
};

export type NaturalGasDataPoint = {
    timestamp: Date;
    therms: number;
    emissions: number;
};

export type WasteDataPoint = {
    timestamp: Date;
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
    squareFootage: number;
    imageURL: string;
    electricityUsage: Array<ElectricityDataPoint>;
    naturalGasUsage: Array<NaturalGasDataPoint>;
    wasteGeneration: Array<WasteDataPoint>;
}

const getBuildingsFromFirebase = async () => {
    const querySnapshot = await getDocs(collection(db, "buildings"));
    const buildings: Building[] = [];

    querySnapshot.forEach(doc => {
        buildings.push({ id: doc.id, ...doc.data() } as Building);
    });

    return buildings;
}

const updateBuildingInFirebase = async (buildingId: string, newData: Partial<Building>) => {
    const docRef = doc(db, "buildings", buildingId);

    await setDoc(docRef, newData, { merge: true });
}

export function useBuildingList() {
    const query = useQuery<Building[], Error>({
        queryKey: ['buildings'],
        queryFn: getBuildingsFromFirebase,
        staleTime: 10 * 60 * 1000, // 10 minutes until data is considered stale
        gcTime: 15 * 60 * 1000, // 15 minutes until unused data is garbage collected
    });

    return {
        ...query,
    };
}

export function useBuilding(buildingId: string) {
    const queryClient = useQueryClient();

    const query = useQuery<Building, Error>({
        queryKey: ['building', buildingId],
        queryFn: () => getBuildingFromFirebase(buildingId),
        staleTime: 10 * 60 * 1000, // 10 minutes until data is considered stale
        gcTime: 15 * 60 * 1000, // 15 minutes until unused data is garbage collected
    });

    const mutation = useMutation({
        mutationFn: (data: Partial<Building>) => updateBuildingInFirebase(buildingId, data),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['building', buildingId] });
            const previousBuilding = queryClient.getQueryData<Building>(['building', buildingId]);

            queryClient.setQueryData<Building>(['building', buildingId], (oldData) => {
                return oldData ? { ...oldData, ...data } : undefined;
            });

            return { previousBuilding };
        },
        onError: (err, newData, context) => {
            console.error("Error updating building data:", err);
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

const getBuildingFromFirebase = async (buildingId: string): Promise<Building> => {
    const docRef = doc(db, "buildings", buildingId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Building;
    } else {
        throw new Error("Building not found");
    }
}
