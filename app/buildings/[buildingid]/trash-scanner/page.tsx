"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Card, CardBody } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import screenfull from 'screenfull';

const TrashScanner: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [endPos, setEndPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="container-fluid p-4">
            <h1 className="text-2xl font-bold text-center mb-4">Trash Scanner</h1>
            <div className="flex flex-col items-center">
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
                <Button
                    onClick={toggleFullScreen}
                    className="w-full md:w-auto md:max-w-[640px]"
                >
                    Toggle Fullscreen
                </Button>
            </div>
        </div>
    );
};

export default TrashScanner;
