import React from 'react';
import { useTime } from '../App';

export const DigitalDate: React.FC = () => {
  const { now } = useTime();

  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-2">
      {dateString}
    </div>
  );
};
