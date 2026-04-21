import React from 'react';

/**
 * A reusable circular progress bar component.
 * @param {number} percentage - Progress from 0 to 100
 * @param {number} size - Diameter of the circle
 * @param {number} strokeWidth - Thickness of the progress line
 * @param {string} color - Tailwind color class for the progress stroke
 */
export default function CircularProgress({ 
    percentage = 0, 
    size = 120, 
    strokeWidth = 10,
    color = "text-[#706BFF]"
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-[#F0F0F8]"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    className={`${color} transition-all duration-500 ease-out`}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-[#1A1A1A]">{percentage}%</span>
            </div>
        </div>
    );
}
