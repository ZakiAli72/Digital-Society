import React from 'react';

interface HighlightProps {
  text: string;
  highlight: string;
}

export const Highlight: React.FC<HighlightProps> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  
  const highlightTerms = highlight.trim().split(' ').filter(Boolean).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if(highlightTerms.length === 0) {
      return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlightTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/50 rounded px-0.5 py-0 font-semibold text-slate-900 dark:text-slate-50">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};
