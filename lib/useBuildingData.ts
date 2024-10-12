// lib/useBuildingData.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

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

export function useBuildingData() {
    const queryClient = useQueryClient();

    const query = useQuery<Building[], Error>({
        queryKey: ['buildings'],
        queryFn: getBuildingsFromFirebase,
        staleTime: 10 * 60 * 1000, // 10 minutes until data is considered stale
        gcTime: 15 * 60 * 1000, // 15 minutes until unused data is garbage collected
    });

    const mutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Building> }) =>
            updateBuildingInFirebase(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['buildings'] });
            const previousBuildings = queryClient.getQueryData<Building[]>(['buildings']);

            queryClient.setQueryData<Building[]>(['buildings'], (oldData) => {
                return oldData?.map(building =>
                    building.id === id ? { ...building, ...data } : building
                ) ?? [];
            });

            return { previousBuildings };
        },
        onError: (err, newData, context) => {
            console.error("Error updating building data:", err);
            queryClient.setQueryData(['buildings'], context!.previousBuildings);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
        }
    });

    return {
        ...query,
        updateBuilding: mutation.mutate
    };
}