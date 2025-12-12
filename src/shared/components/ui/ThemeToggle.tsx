
import React from 'react';
import { Sun, Cloud, Moon } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, cycleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light': return <Sun size={20} className="text-yellow-500" />;
      case 'shade': return <Cloud size={20} className="text-blue-300" />;
      case 'dark': return <Moon size={20} className="text-brand-sage" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'shade': return 'Shade Mode';
      case 'dark': return 'Dark Mode';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-full hover:bg-theme-bg-tertiary transition-colors relative group"
      title={`Current: ${getLabel()}`}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </button>
  );
};

export default ThemeToggle;
