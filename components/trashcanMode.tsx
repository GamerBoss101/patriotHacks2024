"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { InferenceEngine, CVImage } from "inferencejs";

function TrashcanMode() {

    // Initialize the inference engine and state variables
    const inferEngine = useMemo(() => new InferenceEngine(), []);
    const [modelWorkerId, setModelWorkerId] = useState<string | null>(null);
    const [modelLoading, setModelLoading] = useState(false);
    const [highestProbItem, setHighestProbItem] = useState<string | null>(null);

    // Reference to the video element
    const videoRef = useRef<HTMLVideoElement>(null);

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

        inferEngine.infer(modelWorkerId, img).then((predictions) => {
            const highestPrediction: any = predictions
                .filter((pred: any) => pred.confidence >= 0.4) // 40% minimum confidence
                .sort((a: any, b: any) => b.confidence - a.confidence)[0];

            if (highestPrediction) {
                setHighestProbItem(`${highestPrediction.class} (${Math.round(highestPrediction.confidence * 100)}%)`);
            } else {
                setHighestProbItem(null);
            }

            setTimeout(detectFrame, 1000 / 3);
        });
    };

    // Render the component
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>

            {/* Hidden video element for capturing webcam feed */}
            <video ref={videoRef} style={{ display: 'none' }}>
                <track kind="captions" />
            </video>

            {/* Display detected item or "No item detected" message */}
            {highestProbItem ? (
                <h1 style={{ fontSize: '4rem', textAlign: 'center' }}>{highestProbItem}</h1>
            ) : (
                <h1 style={{ fontSize: '4rem', textAlign: 'center' }}>No item detected</h1>
            )}
        </div>
    );
}

export default TrashcanMode;
