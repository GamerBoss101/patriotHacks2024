import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FaceProps {
    bin: string;
    isVisible: boolean;
    itemPosition: { x: number; y: number } | null;
    videoDimensions: { width: number; height: number };
    facePosition: { x: number; y: number };
}

const Face: React.FC<FaceProps> = ({ bin, isVisible, itemPosition, videoDimensions, facePosition }) => {
    // Calculate eye rotation based on item position
    const [eyeRotation, setEyeRotation] = useState<number>(0);

    useEffect(() => {
        if (itemPosition && isVisible) {
            const dx = itemPosition.x - facePosition.x;
            const dy = itemPosition.y - facePosition.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            setEyeRotation(angle);
        }
    }, [itemPosition, isVisible, facePosition]);

    return (
        <motion.div
            animate={{ y: isVisible ? 0 : 100 }} // Animate up when visible
            className="face-container"
            initial={{ y: 100 }} // Start below the screen
            transition={{ duration: 0.5 }}
        >
            <div className="face">
                {/* Face SVG or Graphics */}
                <div className="eyes">
                    <div
                        className="eye left-eye"
                        style={{ transform: `rotate(${eyeRotation}deg)` }}
                    />
                    <div
                        className="eye right-eye"
                        style={{ transform: `rotate(${eyeRotation}deg)` }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default Face;