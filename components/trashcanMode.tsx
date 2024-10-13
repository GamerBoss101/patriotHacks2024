/* eslint-disable no-console */
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { InferenceEngine, CVImage } from "inferencejs";

const trashItems = [
    {
        id: "Aluminum-Can",
        name: "Aluminum Can",
        bin: "Recycling",
        co2e: 130
    },
    {
        id: "Aluminum-Foil",
        name: "Aluminum Foil",
        bin: "Recycling",
        note: "Please rinse and flatten",
        co2e: 2
    },
    {
        id: "Bio-Plastic-Cup",
        name: "Bio-Plastic Cup",
        bin: "Compost",
        co2e: 21
    },
    {
        id: "Cardboard",
        name: "Cardboard",
        bin: "Recycling",
        note: "Please flatten all cardboard",
        co2e: 22
    },
    {
        id: "Food",
        name: "Food",
        bin: "Compost",
        co2e: 374
    },
    {
        id: "Food-Wrapper",
        name: "Food Wrapper",
        bin: "Landfill",
        co2e: 155
    },
    {
        id: "Paper",
        name: "Paper",
        bin: "Recycling",
        co2e: 42
    },
    {
        id: "Paper-Cup",
        name: "Paper Cup",
        bin: "Recycling",
        co2e: 66
    },
    {
        id: "Paper-Plate",
        name: "Paper Plate",
        bin: "Recycling",
        co2e: 62
    },
    {
        id: "Paper-Soft",
        name: "Soft Paper",
        bin: "Recycling",
        co2e: 27
    },
    {
        id: "Plastic-Bag",
        name: "Plastic Bag",
        bin: "Landfill",
        co2e: 45
    },
    {
        id: "Plastic-Bottle",
        name: "Plastic Bottle",
        bin: "Recycling",
        note: "Only hard number 1 or 2 bottles",
        co2e: 241
    },
    {
        id: "Plastic-Container",
        name: "Plastic Container",
        bin: "Recycling",
        note: "Only hard number 1 or 2 containers",
        co2e: 30
    },
    {
        id: "Plastic-Cup",
        name: "Plastic Cup",
        bin: "Recycling",
        note: "Only hard number 1 or 2 cups",
        co2e: 33
    },
    {
        id: "Plastic-Utensil",
        name: "Plastic Utensil",
        bin: "Landfill",
        co2e: 59
    },
    {
        id: "Styrofoam",
        name: "Styrofoam",
        bin: "Landfill",
        co2e: 19
    }
]

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
    const [highestProbItem, setHighestProbItem] = useState<string | null>(null);
    const [thrownItems, setThrownItems] = useState<string[]>([]); // List of items estimated to be thrown away

    // Reference to the video element
    const videoRef = useRef<HTMLVideoElement>(null);

    // Tracking detections over time
    const detectionsRef = useRef<{ [className: string]: Detection }>({}); // Ref to store detection history

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
                        if (videoRef.current) {
                            detectFrame();
                        }
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

            console.log("Predictions:", typedPredictions);

            // Get video dimensions
            const videoHeight = videoRef.current?.videoHeight || 480;

            // Filter predictions above confidence threshold
            const validPredictions = typedPredictions.filter((pred) => pred.confidence >= 0.4);

            validPredictions.forEach((pred: Prediction) => {
                const className = pred.class;

                // Adjusted: bbox is an object with properties { height, width, x, y }
                const bbox = pred.bbox; // { height, width, x, y }

                // Initialize tracking for this class if not present
                if (!detectionsRef.current[className]) {
                    detectionsRef.current[className] = {
                        lastSeen: Date.now(),
                        framesSeen: 0,
                        bbox: bbox,
                        isActive: false,
                    };
                } else {
                    // Update tracking info
                    detectionsRef.current[className].lastSeen = Date.now();
                    detectionsRef.current[className].framesSeen += 1;
                    detectionsRef.current[className].bbox = bbox;
                }
            });

            // Check tracked items
            Object.keys(detectionsRef.current).forEach((className) => {
                const detection = detectionsRef.current[className];
                const timeSinceLastSeen = Date.now() - detection.lastSeen;

                // Consider detections within the last second
                if (timeSinceLastSeen < 1000) {

                    // If object has been seen for at least 3 frames, mark as active
                    if (detection.framesSeen >= 3 && !detection.isActive) {
                        detection.isActive = true;
                    }
                } else {
                    // Object is no longer detected
                    if (detection.isActive) {

                        // Apply heuristic: if bounding box was near bottom of the frame
                        const bboxY = detection.bbox.y + detection.bbox.height; // Adjusted: y + height
                        const threshold = videoHeight * 0.8; // 80% of the video height

                        if (bboxY >= threshold) {
                            // Item was likely thrown away
                            setThrownItems((prevItems) => [...prevItems, className]);
                        }
                    }
                    // Remove from tracking
                    delete detectionsRef.current[className];
                }
            });

            // Update the highest probability item for display
            if (validPredictions.length > 0) {
                const highestPrediction = validPredictions.sort((a: Prediction, b: Prediction) => b.confidence - a.confidence)[0];

                setHighestProbItem(`${highestPrediction.class}`);
            } else {
                setHighestProbItem(null);
            }

            setTimeout(detectFrame, 1000 / 3);
        });
    };

    // Render the component
    return (
        <div className="flex flex-col justify-center items-center h-screen">
            {/* Hidden video element for capturing webcam feed */}
            <video ref={videoRef} className="hidden">
                <track kind="captions" />
            </video>

            {/* Display detected item or "No item detected" message */}
            {highestProbItem ? (
                <h1 className="text-6xl text-center">{highestProbItem}</h1>
            ) : (
                <h1 className="text-6xl text-center">No Item Detected</h1>
            )}

            {/* Display list of thrown away items */}
            <div className="mt-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Items Thrown Away:</h2>
                <ul className="list-none p-0 text-2xl">
                    {thrownItems.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default TrashcanMode;
