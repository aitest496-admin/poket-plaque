import React from 'react';
import Tooth from './Tooth';
import SideLabels from './common/SideLabels';
import * as Icons from './Icons';
import { ToothData, MeasurementMethod, Quadrant } from '../types';

interface EditorMainProps {
    currentQuadrant: Quadrant;
    teeth: { [key in Quadrant]: ToothData[] };
    handleToothUpdate: (quadrant: Quadrant, updatedTooth: ToothData) => void;
    measurementMethod: MeasurementMethod;
    goUp: () => void;
    goDown: () => void;
    goLeft: () => void;
    goRight: () => void;
}

const EditorMain: React.FC<EditorMainProps> = ({
    currentQuadrant,
    teeth,
    handleToothUpdate,
    measurementMethod,
    goUp,
    goDown,
    goLeft,
    goRight,
}) => {
    const isLower = currentQuadrant.startsWith('L');
    const showLeftControls = (currentQuadrant === 'UL' || currentQuadrant === 'LL');
    const showRightControls = (currentQuadrant === 'UR' || currentQuadrant === 'LR');

    return (
        <div className="flex-1 h-full overflow-hidden relative border border-slate-200 bg-slate-50 rounded-lg shadow-inner">
            <div className="w-full h-full flex items-center justify-center p-2 md:p-4 overflow-auto">
                <div className="flex items-center gap-1 md:gap-4 max-w-full">
                    {/* Left Arrow Controls (UL / LL) */}
                    <div className="flex flex-col gap-2">
                        {!isLower && (
                            <button
                                onClick={goUp}
                                className={`w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-300`}
                                aria-label="Go Up"
                            >
                                <Icons.ArrowUpIcon />
                            </button>
                        )}
                        <button
                            onClick={goLeft}
                            className={`w-10 h-24 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 active:bg-blue-800 transition-opacity duration-300 ${showLeftControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            aria-label="Go Left"
                        >
                            <Icons.ArrowLeftIcon />
                        </button>
                        {!isLower && (
                            <button
                                onClick={goDown}
                                className={`w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-300`}
                                aria-label="Go Down"
                            >
                                <Icons.ArrowDownIcon />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 bg-white p-2 md:p-4 rounded-xl shadow-lg border border-slate-200">
                        <div className="flex items-stretch gap-1 md:gap-2">
                            <SideLabels jaw={isLower ? 'lower' : 'upper'} />
                            <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {teeth[currentQuadrant].map((tooth) => (
                                    <Tooth
                                        key={`${currentQuadrant}-${tooth.id}`}
                                        data={tooth}
                                        onUpdate={(updated) => handleToothUpdate(currentQuadrant, updated)}
                                        jaw={isLower ? 'lower' : 'upper'}
                                        method={measurementMethod}
                                    />
                                ))}
                            </div>
                            <SideLabels jaw={isLower ? 'lower' : 'upper'} />
                        </div>
                    </div>

                    {/* Right Arrow Controls (UR / LR) */}
                    <div className="flex flex-col gap-2">
                        {!isLower && (
                            <button
                                onClick={goUp}
                                className={`w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-300`}
                                aria-label="Go Up"
                            >
                                <Icons.ArrowUpIcon />
                            </button>
                        )}
                        <button
                            onClick={goRight}
                            className={`w-10 h-24 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 active:bg-blue-800 transition-opacity duration-300 ${showRightControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            aria-label="Go Right"
                        >
                            <Icons.ArrowRightIcon />
                        </button>
                        {!isLower && (
                            <button
                                onClick={goDown}
                                className={`w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-300`}
                                aria-label="Go Down"
                            >
                                <Icons.ArrowDownIcon />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorMain;
