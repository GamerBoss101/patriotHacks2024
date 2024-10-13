/* eslint-disable no-console */
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { InferenceEngine, CVImage } from "inferencejs";

function RealtimeModel() {
    const inferEngine = useMemo(() => new InferenceEngine(), []);
    const [modelWorkerId, setModelWorkerId] = useState<string | null>(null);
    const modelWorkerIdRef = useRef<string | null>(null);
    const [modelLoading, setModelLoading] = useState(false);
    const [predictions, setPredictions] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // References to manage media stream and timeouts
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const detectFrameTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        console.log("Component mounted");
        setModelLoading(true);

        inferEngine
            .startWorker("trash-detection-kkthk", 7, "rf_1nBQDUSClLUApDgPjG78qMbBH602")
            .then((id) => {
                setModelWorkerId(id);
                modelWorkerIdRef.current = id;
                startWebcam();
            })
            .catch((error) => {
                console.error("Error starting model worker:", error);
            });

        // Cleanup function to stop the model worker and webcam when the component unmounts
        return () => {
            console.log("Component unmounting, stopping model worker and webcam");
            if (modelWorkerIdRef.current) {
                inferEngine.stopWorker(modelWorkerIdRef.current);
                console.log(`Stopped model worker with ID: ${modelWorkerIdRef.current}`);
            }
            stopWebcam();
            if (detectFrameTimeoutRef.current) {
                clearTimeout(detectFrameTimeoutRef.current);
                detectFrameTimeoutRef.current = null;
                console.log("Cleared detectFrameTimeoutRef");
            }
        };
    }, [inferEngine]);

    const startWebcam = () => {
        const constraints = {
            audio: false,
            video: {
                facingMode: "environment",
            },
        };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
                mediaStreamRef.current = stream; // Store the stream reference
                if (videoRef.current && containerRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                    };

                    videoRef.current.onplay = () => {
                        if (canvasRef.current && videoRef.current && containerRef.current) {
                            detectFrame();
                        }
                    };
                }
            })
            .catch((error) => {
                console.error("Error accessing webcam:", error);
            });
    };

    const stopWebcam = () => {
        if (mediaStreamRef.current) {
            console.log("Stopping webcam...");
            mediaStreamRef.current.getTracks().forEach((track) => {
                track.stop();
                console.log(`Stopped track: ${track.kind}`);
            });
            mediaStreamRef.current = null;
        } else {
            console.log("No media stream to stop.");
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
            console.log("Video paused and srcObject cleared.");
        }
    };

    const detectFrame = () => {
        if (!modelWorkerIdRef.current) {
            detectFrameTimeoutRef.current = window.setTimeout(detectFrame, 1000 / 3);
            return;
        }

        if (videoRef.current && canvasRef.current) {
            const img = new CVImage(videoRef.current);

            inferEngine.infer(modelWorkerIdRef.current, img).then((newPredictions) => {
                const ctx = canvasRef.current!.getContext("2d")!;

                // Clear the canvas
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

                // Get the scaling factors
                const scaleX = canvasRef.current!.width / (videoRef.current!.videoWidth ?? 1);
                const scaleY = canvasRef.current!.height / (videoRef.current!.videoHeight ?? 1);

                newPredictions.forEach((prediction: any) => {
                    const x = (prediction.bbox.x - prediction.bbox.width / 2) * scaleX;
                    const y = (prediction.bbox.y - prediction.bbox.height / 2) * scaleY;
                    const width = prediction.bbox.width * scaleX;
                    const height = prediction.bbox.height * scaleY;

                    // Draw bounding box
                    ctx.strokeStyle = prediction.color;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, width, height);
                });

                setPredictions(newPredictions);
                detectFrameTimeoutRef.current = window.setTimeout(detectFrame, 1000 / 3);
            }).catch((error) => {
                console.error("Error during inference:", error);
            });
        }
    };

    return (
        <div ref={containerRef} className="w-full h-screen relative overflow-hidden">
            <div className="absolute inset-0">
                <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
                >
                    <track kind="captions" />
                </video>
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
                />
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl">
                <div className="bg-black bg-opacity-50 backdrop-filter backdrop-blur-md rounded-xl p-4 text-white text-center">
                    {predictions.length > 0 ? (
                        predictions.map((prediction, index) => (
                            <div key={index} className="text-lg">
                                {`${prediction.class} - ${Math.round(prediction.confidence * 100)}%`}
                            </div>
                        ))
                    ) : (
                        <div className="text-lg">No Item Detected</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RealtimeModel;