/* eslint-disable no-console */
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { InferenceEngine, CVImage } from "inferencejs";
import { motion } from "framer-motion";
import { Timestamp } from 'firebase/firestore';
import { useParams } from "next/navigation";

import { useBuilding, WasteDataPoint } from '@/lib/useBuildingData';

export const trashItems = [
    {
        id: "Aluminum-Can",
        name: "Aluminum Can",
        bin: "Recycling",
        co2e: 170,
    },
    {
        id: "Aluminum-Foil",
        name: "Aluminum Foil",
        bin: "Recycling",
        note: "Please rinse and flatten",
        co2e: 10,
    },
    {
        id: "Bio-Plastic-Cup",
        name: "Bio-Plastic Cup",
        bin: "Compost",
        co2e: 70,
    },
    {
        id: "Cardboard",
        name: "Cardboard",
        bin: "Recycling",
        note: "Please flatten all cardboard",
        co2e: 80,
    },
    {
        id: "Food",
        name: "Food",
        bin: "Compost",
        co2e: 1000,
    },
    {
        id: "Food-Wrapper",
        name: "Food Wrapper",
        bin: "Landfill",
        co2e: 6,
    },
    {
        id: "Paper",
        name: "Paper",
        bin: "Recycling",
        co2e: 8,
    },
    {
        id: "Paper-Cup",
        name: "Paper Cup",
        bin: "Recycling",
        co2e: 11,
    },
    {
        id: "Paper-Plate",
        name: "Paper Plate",
        bin: "Compost",
        co2e: 15,
    },
    {
        id: "Paper-Soft",
        name: "Soft Paper",
        bin: "Recycling",
        co2e: 5,
    },
    {
        id: "Plastic-Bag",
        name: "Plastic Bag",
        bin: "Landfill",
        co2e: 33,
    },
    {
        id: "Plastic-Bottle",
        name: "Plastic Bottle",
        bin: "Recycling",
        note: "Only hard number 1 or 2 bottles",
        co2e: 82,
    },
    {
        id: "Plastic-Container",
        name: "Plastic Container",
        bin: "Recycling",
        note: "Only hard plastics number 1 or 2",
        co2e: 100,
    },
    {
        id: "Plastic-Cup",
        name: "Plastic Cup",
        bin: "Recycling",
        note: "Only hard plastics number 1 or 2",
        co2e: 30,
    },
    {
        id: "Plastic-Utensil",
        name: "Plastic Utensil",
        bin: "Landfill",
        co2e: 8,
    },
    {
        id: "Styrofoam",
        name: "Styrofoam",
        bin: "Landfill",
        co2e: 45,
    },
];

interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Prediction {
    class: string;
    confidence: number;
    bbox: BBox;
    color: string;
}

interface Detection {
    className: string;
    lastSeen: number;
    framesSeen: number;
    bbox: BBox;
    isActive: boolean;
}

function TrashcanMode() {
    // Initialize the inference engine and state variables
    const inferEngine = useMemo(() => new InferenceEngine(), []);
    const [modelWorkerId, setModelWorkerId] = useState<string | null>(null);
    const [modelLoading, setModelLoading] = useState(false);
    const [currentItem, setCurrentItem] = useState<any | null>(null); // Current detected item
    const [thrownItems, setThrownItems] = useState<string[]>([]); // List of items estimated to be thrown away
    const [showCelebration, setShowCelebration] = useState(false); // State to trigger celebration
    const [showCamera, setShowCamera] = useState(false); // Default to false as per your preference
    const [isHovering, setIsHovering] = useState(false); // State to detect hover over the switch area

    // References to DOM elements
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Tracking detections over time
    const detectionsRef = useRef<{ [className: string]: Detection }>({}); // Ref to store detection history

    // Introduce a ref to keep track of the last active item and its timestamp
    const lastActiveItemRef = useRef<{ itemDetails: any | null; timestamp: number }>({
        itemDetails: null,
        timestamp: 0,
    });

    // Inside the component, get the building data
    const { buildingid } = useParams();
    const { data: building, isLoading, error, updateBuilding } = useBuilding(buildingid as string);

    // Effect to start the model worker
    useEffect(() => {
        if (!modelLoading) {
            setModelLoading(true);
            inferEngine
                .startWorker("trash-detection-kkthk", 7, "rf_1nBQDUSClLUApDgPjG78qMbBH602")
                .then((id) => setModelWorkerId(id))
                .catch((error) => {
                    console.error("Error starting model worker:", error);
                });
        }
    }, [inferEngine, modelLoading]);

    // Effect to start the webcam when the model worker is ready
    useEffect(() => {
        if (modelWorkerId) {
            startWebcam();
        }
    }, [modelWorkerId]);

    // Function to initialize and start the webcam
    const startWebcam = () => {
        const constraints = {
            audio: false,
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "environment",
            },
        };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                    };

                    videoRef.current.onplay = () => {
                        detectFrame();
                    };
                }
            })
            .catch((error) => {
                console.error("Error accessing webcam:", error);
            });
    };

    // Function to detect objects in each video frame
    const detectFrame = () => {
        if (!modelWorkerId || !videoRef.current) {
            setTimeout(detectFrame, 1000 / 3);

            return;
        }

        const img = new CVImage(videoRef.current);

        inferEngine.infer(modelWorkerId, img).then((predictions: unknown) => {
            const typedPredictions = predictions as Prediction[];

            const videoWidth = videoRef.current?.videoWidth ?? 640;
            const videoHeight = videoRef.current?.videoHeight ?? 480;

            const now = Date.now();

            // Filter predictions above confidence threshold
            const validPredictions = typedPredictions.filter((pred) => pred.confidence >= 0.2);

            if (showCamera && canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d")!;
                const canvasWidth = canvasRef.current.width;
                const canvasHeight = canvasRef.current.height;

                // Clear the canvas
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                // Draw trash can regions
                drawTrashcanRegions(ctx, videoWidth, videoHeight, canvasWidth, canvasHeight);

                // Get scaling factors
                const scaleX = canvasWidth / (videoWidth ?? 1);
                const scaleY = canvasHeight / (videoHeight ?? 1);

                validPredictions.forEach((pred: Prediction) => {
                    // Draw bounding box and center point
                    drawBoundingBox(ctx, pred, scaleX, scaleY);
                });
            }

            validPredictions.forEach((pred: Prediction) => {
                const className = pred.class;
                const bbox = pred.bbox;

                // Initialize tracking for this class if not present
                if (!detectionsRef.current[className]) {
                    detectionsRef.current[className] = {
                        className: className,
                        lastSeen: now,
                        framesSeen: 1,
                        bbox: bbox,
                        isActive: false,
                    };
                } else {
                    // Update tracking info
                    const detection = detectionsRef.current[className];

                    detection.lastSeen = now;
                    detection.framesSeen += 1;
                    detection.bbox = bbox;

                    // Mark as active if seen consistently over 3 frames
                    if (detection.framesSeen >= 3 && !detection.isActive) {
                        detection.isActive = true;
                    }
                }
            });

            // Remove stale detections and check if any active detections are present
            let activeDetections = Object.values(detectionsRef.current).filter((detection) => {
                const timeSinceLastSeen = now - detection.lastSeen;

                if (timeSinceLastSeen > 1000) {
                    // Remove stale detections
                    if (detection.isActive) {
                        // Determine if last known position was near the correct trashcan area
                        const itemDetails = trashItems.find((item) => item.id === detection.className);

                        if (itemDetails) {
                            const isNearCorrectTrashcan = checkIfNearTrashcanArea(
                                detection.bbox,
                                itemDetails.bin,
                                videoWidth,
                                videoHeight
                            );

                            if (isNearCorrectTrashcan) {
                                // Item was likely thrown away in the correct bin
                                setThrownItems((prevItems) => [...prevItems, detection.className]);
                                setShowCelebration(true); // Trigger celebration
                                setTimeout(() => setShowCelebration(false), 3000); // Stop celebration after 3 seconds

                                const adjustedEmissions = itemDetails.co2e / 1e+3; // Convert kg to tons
                                const newWasteDataPoint: WasteDataPoint = {
                                    timestamp: Timestamp.now(),
                                    type: itemDetails.id,
                                    trashcanID: '1', // Use trashcan ID 1
                                    wasteCategory: itemDetails.bin,
                                    emissions: adjustedEmissions,
                                };

                                // Update the building's waste generation data
                                const updatedWasteGeneration = [
                                    ...(building?.wasteGeneration || []),
                                    newWasteDataPoint,
                                ];

                                updateBuilding({ wasteGeneration: updatedWasteGeneration });
                            } else {
                                // Incorrect bin, do not trigger celebration
                                setCurrentItem(null);
                            }
                        }
                    }
                    delete detectionsRef.current[detection.className];

                    return false;
                }

                return detection.isActive;
            });

            // Update the current item for display based on active detections
            if (activeDetections.length > 0) {
                // Find the most recently seen active detection
                activeDetections.sort((a, b) => b.lastSeen - a.lastSeen);
                const mostRecentDetection = activeDetections[0];
                const itemDetails = trashItems.find((item) => item.id === mostRecentDetection.className);

                // Update last active item reference
                lastActiveItemRef.current = { itemDetails, timestamp: now };
                setCurrentItem(itemDetails);
            } else {
                // If no active detections, retain the last item for a short duration
                if (now - lastActiveItemRef.current.timestamp < 1000) {
                    setCurrentItem(lastActiveItemRef.current.itemDetails);
                } else {
                    setCurrentItem(null);
                    lastActiveItemRef.current = { itemDetails: null, timestamp: 0 };
                }
            }

            setTimeout(detectFrame, 1000 / 3);
        });
    };

    // Helper function to draw bounding box and center point
    const drawBoundingBox = (ctx: CanvasRenderingContext2D, prediction: Prediction, scaleX: number, scaleY: number) => {
        const x = (prediction.bbox.x - prediction.bbox.width / 2) * scaleX;
        const y = (prediction.bbox.y - prediction.bbox.height / 2) * scaleY;
        const width = prediction.bbox.width * scaleX;
        const height = prediction.bbox.height * scaleY;

        // Draw bounding box
        ctx.strokeStyle = prediction.color || "#FF0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw center point
        ctx.fillStyle = prediction.color || "#FF0000";
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, 5, 0, 2 * Math.PI);
        ctx.fill();
    };

    // Helper function to draw trashcan regions
    const drawTrashcanRegions = (
        ctx: CanvasRenderingContext2D,
        videoWidth: number,
        videoHeight: number,
        canvasWidth: number,
        canvasHeight: number
    ) => {
        const trashcanAreas = getTrashcanAreas(videoWidth, videoHeight);

        const scaleX = canvasWidth / (videoWidth ?? 1);
        const scaleY = canvasHeight / (videoHeight ?? 1);

        Object.entries(trashcanAreas).forEach(([bin, area]) => {
            const x = area.x * scaleX;
            const y = area.y * scaleY;
            const width = area.width * scaleX;
            const height = area.height * scaleY;

            ctx.strokeStyle = getBinColor(bin);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Optionally, fill the area with transparent color
            ctx.fillStyle = getBinColor(bin) + "33"; // Add transparency
            ctx.fillRect(x, y, width, height);
        });
    };

    // Helper function to check if the bounding box is near the correct trashcan area
    const checkIfNearTrashcanArea = (
        bbox: BBox,
        correctBin: string,
        videoWidth: number,
        videoHeight: number
    ): boolean => {
        const centerX = bbox.x;
        const centerY = bbox.y;

        // Define areas for each trashcan
        const trashcanAreas = getTrashcanAreas(videoWidth, videoHeight);

        // Check if the center point is within any trashcan area
        for (const [bin, area] of Object.entries(trashcanAreas)) {
            if (
                centerX >= area.x &&
                centerX <= area.x + area.width &&
                centerY >= area.y &&
                centerY <= area.y + area.height
            ) {
                const isCorrect = bin === correctBin;

                return isCorrect;
            }
        }

        // If not near any bin
        return false;
    };

    // Helper function to define trashcan areas
    const getTrashcanAreas = (videoWidth: number, videoHeight: number) => {
        const areaWidth = (videoWidth * 2) / 5; // 2/5 of the screen width
        const areaHeight = videoHeight / 2; // 1/2 of the screen height

        return {
            Recycling: {
                x: 0,
                y: videoHeight / 2,
                width: areaWidth,
                height: areaHeight,
            },
            Compost: {
                x: (videoWidth - areaWidth) / 2,
                y: videoHeight / 2,
                width: areaWidth,
                height: areaHeight,
            },
            Landfill: {
                x: videoWidth - areaWidth,
                y: videoHeight / 2,
                width: areaWidth,
                height: areaHeight,
            },
        };
    };

    // Helper function to get bin color
    const getBinColor = (bin: string) => {
        switch (bin) {
            case "Recycling":
                return "#00aaff"; // Blue
            case "Compost":
                return "#00aa00"; // Green
            case "Landfill":
                return "#aaaaaa"; // Gray
            default:
                return "#ffffff"; // White
        }
    };

    // Helper function to get arrow symbol
    const getArrow = (bin: string) => {
        switch (bin) {
            case "Recycling":
                return "→"; // Right arrow
            case "Compost":
                return "↓"; // Down arrow
            case "Landfill":
                return "←"; // Left arrow
            default:
                return "";
        }
    };

    // Render the component
    return (
        <div
            ref={containerRef}
            className="w-full h-screen relative overflow-hidden"
            style={{
                backgroundColor: currentItem ? getBinColor(currentItem.bin) : "#ffffff",
                transition: "background-color 0.5s ease-in-out",
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Hidden video element for capturing webcam feed */}
            <video
                ref={videoRef}
                muted
                playsInline
                className="hidden"
            >
                <track kind="captions" />
            </video>

            {/* Video and canvas elements for display */}
            {showCamera && (
                <div className="absolute inset-0">
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover opacity-30"
                        style={{ transform: "scaleX(-1)" }}
                    >
                        <track kind="captions" />
                    </video>
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                        style={{ transform: "scaleX(-1)" }}
                    />
                </div>
            )}

            {/* Switch to toggle camera visibility */}
            {/* <div
                className="absolute top-2 right-2 transition-opacity duration-200 z-20"
                style={{ opacity: isHovering ? 1 : 0 }}
            >
                <Switch isSelected={showCamera} onValueChange={setShowCamera}>
                    Camera
                </Switch>
            </div> */}

            {/* Main content */}
            <div className="relative z-10 flex flex-col justify-center items-center h-full w-full">
                {/* Display celebration animation if item thrown away */}
                {showCelebration ? (
                    <div className="flex flex-col justify-center items-center">
                        {/* Celebration animation */}
                        <motion.div
                            animate={{ scale: 1 }}
                            initial={{ scale: 0 }}
                            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                        >
                            <span aria-label="Check Mark" className="text-[11rem]" role="img">
                                ✅
                            </span>
                        </motion.div>
                    </div>
                ) : currentItem ? (
                    // Display detected item
                    <div className="flex flex-col justify-between items-center h-full w-full p-8">
                        <div className="flex flex-col items-center pt-8">
                            <h1 className="text-9xl text-center">
                                {getArrow(currentItem.bin)} {currentItem.bin} {getArrow(currentItem.bin)}
                            </h1>
                        </div>

                        {/* Display item name and note */}
                        <div className="mb-8">
                            <h2 className="text-4xl text-center">
                                {currentItem.name} {currentItem.note ? `- ${currentItem.note}` : ""}
                            </h2>
                        </div>
                    </div>
                ) : (
                    // Display "No Item Detected" message
                    <div className="flex flex-col items-center">
                        <h1 className="text-8xl text-center mb-8">No Item Detected</h1>
                        {thrownItems.length > 0 && (
                            <div className="mt-4 text-center">
                                <h2 className="text-xl font-bold mb-2">Items Thrown Away Recently:</h2>
                                <p className="text-lg">
                                    {Object.entries(
                                        thrownItems.slice(-5).reduce((acc: { [key: string]: number }, item) => {
                                            acc[item] = (acc[item] || 0) + 1;

                                            return acc;
                                        }, {})
                                    )
                                        .map(([item, count]) => (count > 1 ? `${item} (${count}x)` : item))
                                        .join(", ")}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TrashcanMode;