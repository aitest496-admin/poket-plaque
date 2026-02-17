import React from 'react';
import Tooth from './Tooth';
import { ToothData, MeasurementMethod, Quadrant } from '../types';

interface OnePointViewProps {
    teeth: { [key in Quadrant]: ToothData[] };
    handleToothUpdate: (quadrant: Quadrant, updatedTooth: ToothData) => void;
}

const OnePointView: React.FC<OnePointViewProps> = ({ teeth, handleToothUpdate }) => {
    return (
        <div className="w-full h-full overflow-hidden p-2 flex items-start justify-center touch-none select-none">
            <div className="flex flex-col gap-1 w-full max-w-full">
                {/* Upper teeth row */}
                <div className="flex justify-center gap-[1px]">
                    {teeth.UL.map((tooth) => (
                        <Tooth
                            key={`UL-${tooth.id}`}
                            data={tooth}
                            lowerData={teeth.LL.find(t => t.id === tooth.id)}
                            onUpdate={(updated) => handleToothUpdate('UL', updated)}
                            onUpdateLower={(updated) => handleToothUpdate('LL', updated)}
                            jaw="upper"
                            method="1-point"
                        />
                    ))}
                    {teeth.UR.map((tooth) => (
                        <Tooth
                            key={`UR-${tooth.id}`}
                            data={tooth}
                            lowerData={teeth.LR.find(t => t.id === tooth.id)}
                            onUpdate={(updated) => handleToothUpdate('UR', updated)}
                            onUpdateLower={(updated) => handleToothUpdate('LR', updated)}
                            jaw="upper"
                            method="1-point"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OnePointView;
