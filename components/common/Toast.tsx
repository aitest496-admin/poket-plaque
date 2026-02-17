import React from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgClass = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-slate-800';

    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 ${bgClass} text-white px-6 py-3 rounded-full shadow-2xl z-[300] flex items-center gap-3 animate-fade-in-up`}>
            <span className="font-bold text-sm tracking-wide">{message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
