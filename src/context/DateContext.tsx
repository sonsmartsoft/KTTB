import React, { createContext, useContext, useState } from 'react';
import { format, parseISO, addDays, subDays } from 'date-fns';

interface DateContextType {
  selectedDate: string; // 'YYYY-MM-DD'
  setSelectedDate: (date: string) => void;
  goToNextDay: () => void;
  goToPrevDay: () => void;
  goToToday: () => void;
  goToSampleDate: () => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const DateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to today's real date
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

  const goToNextDay = () => {
    const next = addDays(parseISO(selectedDate), 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const goToPrevDay = () => {
    const prev = subDays(parseISO(selectedDate), 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const goToSampleDate = () => {
    setSelectedDate('2026-09-21');
  };

  return (
    <DateContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        goToNextDay,
        goToPrevDay,
        goToToday,
        goToSampleDate,
      }}
    >
      {children}
    </DateContext.Provider>
  );
};

export const useScheduleDate = (): DateContextType => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useScheduleDate must be used within a DateProvider');
  }
  return context;
};
