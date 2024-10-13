"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { InferenceEngine, CVImage } from "inferencejs";

function RealtimeModel() {
    const inferEngine = useMemo(() => new InferenceEngine(), []);
    const [modelWorkerId, setModelWorkerId] = useState<string | null>(null);
    const [modelLoading, setModelLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

    useEffect(() => {
        if (modelWorkerId) {
            startWebcam();
        }
    }, [modelWorkerId]);

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
                        if (canvasRef.current && videoRef.current) {
                            const ctx = canvasRef.current.getContext("2d")!;

                            const height = videoRef.current.videoHeight;
                            const width = videoRef.current.videoWidth;

                            videoRef.current.width = width;
                            videoRef.current.height = height;

                            canvasRef.current.width = width;
                            canvasRef.current.height = height;

                            // Flip the context horizontally
                            ctx.translate(canvasRef.current.width, 0);
                            ctx.scale(-1, 1);

                            detectFrame();
                        }
                    };
                }
            })
            .catch((error) => {
                console.error("Error accessing webcam:", error);
            });
    };

    const detectFrame = () => {
        if (!modelWorkerId) {
            setTimeout(detectFrame, 1000 / 3);

            return;
        }

        if (videoRef.current && canvasRef.current) {
            const img = new CVImage(videoRef.current);

            inferEngine.infer(modelWorkerId, img).then((predictions) => {
                const ctx = canvasRef.current!.getContext("2d")!;

                // Clear the canvas
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

                predictions.forEach((prediction: any) => {
                    const x = prediction.bbox.x - prediction.bbox.width / 2;
                    const y = prediction.bbox.y - prediction.bbox.height / 2;
                    const width = prediction.bbox.width;
                    const height = prediction.bbox.height;

                    // Draw bounding box
                    ctx.strokeStyle = prediction.color;
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x, y, width, height);

                    // Draw label background
                    ctx.fillStyle = prediction.color;
                    const text = `${prediction.class} ${Math.round(prediction.confidence * 100)}%`;

                    ctx.font = "16px sans-serif";
                    const textMetrics = ctx.measureText(text);
                    const textWidth = textMetrics.width;
                    const textHeight = 16; // Approximate text height

                    ctx.fillRect(x - 2, y - textHeight - 4, textWidth + 4, textHeight + 4);

                    // Draw text
                    ctx.fillStyle = "black";
                    ctx.fillText(text, x, y - 10);
                });

                setTimeout(detectFrame, 1000 / 3);
            });
        }
    };

    return (
        <div>
            <div style={{ position: "relative" }}>
                <video
                    ref={videoRef}
                    style={{ position: "relative", transform: "scaleX(-1)" }} // Flip for mirror effect
                >
                    <track kind="captions" />
                </video>
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", top: 0, left: 0 }}
                />
            </div>
        </div>
    );
}

export default RealtimeModel;