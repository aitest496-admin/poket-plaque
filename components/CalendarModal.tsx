import React, { useState, useEffect } from 'react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  markedDates: string[]; // List of 'YYYY-MM-DD' that have data
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onSelectDate, selectedDate, markedDates }) => {
  const [displayDate, setDisplayDate] = useState(new Date());

  // Initialize display date to marked date or today when opened
  useEffect(() => {
    if (isOpen) {
      const initialDate = selectedDate ? new Date(selectedDate) : new Date();
      if (!isNaN(initialDate.getTime())) {
          setDisplayDate(initialDate);
      }
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth(); // 0-indexed

  // Calendar Logic
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

  // Generate calendar grid array
  const calendarDays: (number | null)[] = [];
  // Empty slots for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handlePrevMonth = () => {
    setDisplayDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setDisplayDate(today);
    const dateStr = today.toISOString().split('T')[0];
    onSelectDate(dateStr);
    onClose();
  };

  const handleDateClick = (day: number) => {
    // Format YYYY-MM-DD manually to avoid timezone issues
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    onSelectDate(dateStr);
    onClose();
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <button onPointerDown={handlePrevMonth} className="p-1 hover:bg-slate-200 rounded text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="font-bold text-lg text-slate-800">
            {year}年 {month + 1}月
          </div>
          <button onPointerDown={handleNextMonth} className="p-1 hover:bg-slate-200 rounded text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d, i) => (
              <div key={i} className={`text-center text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              // Check attributes
              const m = (month + 1).toString().padStart(2, '0');
              const d = day.toString().padStart(2, '0');
              const dateStr = `${year}-${m}-${d}`;
              
              const isSelected = dateStr === selectedDate;
              const isMarked = markedDates.includes(dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={day}
                  onPointerDown={() => handleDateClick(day)}
                  className={`
                    aspect-square rounded-full flex flex-col items-center justify-center relative transition-all text-sm font-medium
                    ${isSelected 
                        ? 'bg-blue-600 text-white shadow-md scale-105 z-10' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }
                    ${isMarked && !isSelected ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : ''}
                    ${isToday && !isSelected ? 'ring-1 ring-slate-300' : ''}
                  `}
                >
                  <span>{day}</span>
                  {/* Marker Dot */}
                  {isMarked && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
             <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> データあり</span>
             </div>
             <div className="flex gap-2">
                <button 
                    onPointerDown={handleToday}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                    今日へ
                </button>
                <button 
                    onPointerDown={onClose}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded"
                >
                    閉じる
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;