import React from 'react';
import { useTime } from '../App';

export const DigitalClock: React.FC = () => {
  const { now } = useTime();

  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="text-center font-mono text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 py-1.5 px-3 rounded-md">
      {timeString}
    </div>
  );
};
