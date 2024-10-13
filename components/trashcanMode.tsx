/* eslint-disable no-console */
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { InferenceEngine, CVImage } from "inferencejs";
import { motion } from "framer-motion";
import { Timestamp } from 'firebase/firestore';
import { useParams } from "next/navigation";

import { useBuilding, WasteDataPoint } from '@/lib/useBuildingData';
import { Card } from "@nextui-org/react";

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

    // state variables for ripple effect
    const [rippleActive, setRippleActive] = useState(false);
    const [rippleColor, setRippleColor] = useState<string>('');
    const [ripplePosition, setRipplePosition] = useState<{ x: string; y: string }>({ x: '50%', y: '50%' });

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

    // Helper function to get bin emoji
    const getBinEmoji = (bin: string) => {
        switch (bin) {
            case "Recycling":
                return "♻️";
            case "Compost":
                return "🌿";
            case "Landfill":
                return "🗑️";
            default:
                return "";
        }
    };

    // Helper function to get item emoji
    const getItemEmoji = (itemId: string) => {
        switch (itemId) {
            case "Aluminum-Can":
                return "🥫";
            case "Aluminum-Foil":
                return "🥄";
            case "Bio-Plastic-Cup":
                return "🥤";
            case "Cardboard":
                return "📦";
            case "Food":
                return "🍎";
            case "Food-Wrapper":
                return "🍬";
            case "Paper":
                return "📄";
            case "Paper-Cup":
                return "☕";
            case "Paper-Plate":
                return "🍽️";
            case "Paper-Soft":
                return "📃";
            case "Plastic-Bag":
                return "🛍️";
            case "Plastic-Bottle":
                return "🍼";
            case "Plastic-Container":
                return "🍱";
            case "Plastic-Cup":
                return "🥛";
            case "Plastic-Utensil":
                return "🍴";
            case "Styrofoam":
                return "📦";
            default:
                return "";
        }
    };

    // helper function for ripple start position
    const getBinRippleStartPosition = (bin: string) => {
        switch (bin) {
            case "Recycling":
                return { x: '100%', y: '100%' }; // Bottom-right corner
            case "Compost":
                return { x: '50%', y: '100%' }; // Bottom-center
            case "Landfill":
                return { x: '0%', y: '100%' }; // Bottom-left corner
            default:
                return { x: '50%', y: '50%' }; // Center
        }
    };

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

                                // Trigger the ripple effect
                                setRippleColor(getBinColor(itemDetails.bin));
                                setRipplePosition(getBinRippleStartPosition(itemDetails.bin));
                                setRippleActive(true);
                                setTimeout(() => setRippleActive(false), 3000); // Ripple lasts 3 seconds

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
                return "#33cc33"; // Green
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
            className="w-full h-screen relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
        >
            {/* Hidden video element for capturing webcam feed */}
            <video ref={videoRef} muted playsInline className="hidden">
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

            {/* Ripple Effect Overlay */}
            {rippleActive && (
                <div
                    className="ripple-effect"
                    style={{
                        backgroundColor: rippleColor,
                        left: ripplePosition.x,
                        top: ripplePosition.y,
                    }}
                />
            )}

            {/* Main content */}
            <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-8">
                {showCelebration ? (
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                    >
                        <span aria-label="Check Mark" className="text-9xl mb-4" role="img">
                            ✅
                        </span>
                        <h2 className="text-4xl font-bold text-green-600 dark:text-green-400">
                            Great job!
                        </h2>
                    </motion.div>
                ) : currentItem ? (
                    <Card className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 shadow-lg">
                        <h1 className="text-5xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
                            {getBinEmoji(currentItem.bin)} {currentItem.bin} {getArrow(currentItem.bin)}
                        </h1>
                        <h2 className="text-3xl text-center mb-4 text-gray-700 dark:text-gray-300">
                            {getItemEmoji(currentItem.id)} {currentItem.name}
                        </h2>
                        {currentItem.note && (
                            <p className="text-xl text-center text-gray-600 dark:text-gray-400">
                                {currentItem.note}
                            </p>
                        )}
                    </Card>
                ) : (
                    <Card className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 shadow-lg">
                        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
                            No Item Detected
                        </h1>
                        {thrownItems.length > 0 && (
                            <div className="text-center">
                                <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                    Recently Thrown Items:
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                    {Object.entries(
                                        thrownItems.slice(-5).reduce((acc, item) => {
                                            acc[item] = (acc[item] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)
                                    )
                                        .map(([item, count]) => (count > 1 ? `${item} (${count}x)` : item))
                                        .join(", ")}
                                </p>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}

export default TrashcanMode;