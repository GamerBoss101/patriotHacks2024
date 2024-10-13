"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Card, CardBody } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import screenfull from 'screenfull';

const TrashScanner: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const largeCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [endPos, setEndPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [expression, setExpression] = useState<'smile' | 'neutral' | 'frown'>('smile');

    //canvas size
    const setCanvasSize = useCallback(() => {
        const video = webcamRef.current?.video;
        const canvas = canvasRef.current;

        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
    }, []);

    // listener to set canvas size when video is ready
    useEffect(() => {
        const video = webcamRef.current?.video;

        if (video) {
            video.addEventListener('loadedmetadata', setCanvasSize);
        }

        return () => {
            if (video) {
                video.removeEventListener('loadedmetadata', setCanvasSize);
            }
        };
    }, [setCanvasSize]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setIsDrawing(true);
        setStartPos({ x, y });
        setEndPos({ x, y });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setEndPos({ x, y });
    }, [isDrawing]);

    const handleMouseUp = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const drawBox = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            Math.min(startPos.x, endPos.x),
            Math.min(startPos.y, endPos.y),
            Math.abs(endPos.x - startPos.x),
            Math.abs(endPos.y - startPos.y)
        );
    }, [startPos, endPos]);

    React.useEffect(() => {
        drawBox();
    }, [drawBox]);

    const toggleFullScreen = useCallback(() => {
        if (containerRef.current && screenfull.isEnabled) {
            screenfull.toggle(containerRef.current);
        }
    }, []);

    const drawPixelatedFace = useCallback((ctx: CanvasRenderingContext2D, expression: 'smile' | 'neutral' | 'frown', size: number) => {
        ctx.fillStyle = '#008B8B'; // Dark cyan

        // Face
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                ctx.fillRect(x * size, y * size, size, size);
            }
        }

        // Eyes
        ctx.fillStyle = '#ADD8E6'; // Light blue
        ctx.fillRect(1 * size, 2 * size, size, size * 2);
        ctx.fillRect(6 * size, 2 * size, size, size * 2);

        // Mouth
        switch (expression) {
            case 'smile':
                ctx.fillRect(2 * size, 5 * size, size, size);
                ctx.fillRect(3 * size, 6 * size, size * 2, size);
                ctx.fillRect(5 * size, 5 * size, size, size);
                break;
            case 'neutral':
                ctx.fillRect(2 * size, 5 * size, size * 4, size);
                break;
            case 'frown':
                ctx.fillRect(2 * size, 6 * size, size, size);
                ctx.fillRect(3 * size, 5 * size, size * 2, size);
                ctx.fillRect(5 * size, 6 * size, size, size);
                break;
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const largeCanvas = largeCanvasRef.current;
        if (canvas && largeCanvas) {
            const ctx = canvas.getContext('2d');
            const largeCtx = largeCanvas.getContext('2d');
            if (ctx && largeCtx) {
                drawPixelatedFace(ctx, expression, 10);
                drawPixelatedFace(largeCtx, expression, 30);
            }
        }
    }, [expression, drawPixelatedFace]);

    return (
        <div className="container-fluid p-4">
            <h1 className="text-2xl font-bold text-center mb-4">Trash Scanner</h1>
            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-4">
                <Card className="w-full md:w-auto md:max-w-[640px] mb-4">
                    <CardBody className="p-0">
                        <div ref={containerRef} className="relative aspect-video">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            />
                        </div>
                    </CardBody>
                </Card>
                <div className="flex flex-col items-center">
                    <canvas
                        ref={largeCanvasRef}
                        width={240}
                        height={240}
                        className="mb-4"
                    />
                    <div className="flex justify-center space-x-4">
                        {['smile', 'neutral', 'frown'].map((exp) => (
                            <canvas
                                key={exp}
                                width={80}
                                height={80}
                                onClick={() => setExpression(exp as 'smile' | 'neutral' | 'frown')}
                                ref={(canvas) => {
                                    if (canvas) {
                                        const ctx = canvas.getContext('2d');
                                        if (ctx) {
                                            drawPixelatedFace(ctx, exp as 'smile' | 'neutral' | 'frown', 10);
                                        }
                                    }
                                }}
                                className="cursor-pointer"
                            />
                        ))}
                    </div>
                    <p className="mt-2">Current expression: {expression}</p>
                </div>
            </div>
            <Button
                onClick={toggleFullScreen}
                className="w-full md:w-auto md:max-w-[640px] mt-4"
            >
                Toggle Fullscreen
            </Button>
        </div>
    );
};

export default TrashScanner;
