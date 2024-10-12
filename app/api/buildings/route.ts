import { NextResponse } from 'next/server';
import { CosmosClient } from "@azure/cosmos";

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT!,
    key: process.env.COSMOS_KEY!
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE_ID!);
const container = database.container(process.env.COSMOS_CONTAINER_ID!);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log("Received GET request with id:", id);

    try {
        if (id) {
            // Get a single building
            console.log("Attempting to get building with id:", id);

            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            console.log("Query result:", resources);

            if (resources && resources.length > 0) {
                console.log("Returning resource for id:", id);
                return NextResponse.json(resources[0]);
            } else {
                console.log("Building not found for id:", id);
                return NextResponse.json({ message: "Building not found" }, { status: 404 });
            }
        } else {
            // Get all buildings
            console.log("Attempting to get all buildings");
            const { resources } = await container.items.readAll().fetchAll();
            console.log("Number of buildings retrieved:", resources.length);

            return NextResponse.json(resources);
        }
    } catch (error) {
        console.error("Error in GET request:", error);
        return NextResponse.json({ message: "Error fetching data", error }, { status: 500 });
    }
}

// function deepMerge(target: any, source: any) {
//     for (const key in source) {
//         if (Array.isArray(source[key])) {
//             if (!target[key]) target[key] = [];
//             target[key] = [...target[key], ...source[key]];
//         } else if (source[key] instanceof Object && key in target) {
//             deepMerge(target[key], source[key]);
//         } else {
//             target[key] = source[key];
//         }
//     }
//     return target;
// }

export async function PATCH(request: Request) {
    try {
        const { id, operation, ...data } = await request.json();

        // Query for the existing item
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: id }]
        };

        const { resources } = await container.items.query(querySpec).fetchAll();

        let existingItem = resources[0] || { id };

        if (operation === 'deleteWasteEntry') {
            // Remove the waste entry at the specified index
            const index = data.index;
            existingItem.wasteGeneration.splice(index, 1);
        } else {
            // Deep merge the existing data with the new data
            existingItem = { ...existingItem, ...data };
        }


        // Upsert the item
        const { resource: result } = await container.items.upsert(existingItem);

        console.log("Update successful. Result:", result);

        return NextResponse.json({ message: "Building updated successfully", result });
    } catch (error) {
        return NextResponse.json({ message: "Error updating data", error }, { status: 500 });
    }
}
