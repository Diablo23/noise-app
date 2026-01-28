import React, { useState, useRef, useEffect } from 'react';

const FONTS = [
  { id: 'rubik-glitch', name: 'Rubik Glitch', className: 'font-rubik-glitch' },
  { id: 'kapakana', name: 'Kapakana', className: 'font-kapakana' },
  { id: 'shadows', name: 'Shadows Into Light', className: 'font-shadows' },
];

const FontDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedFont = FONTS.find(f => f.id === value) || FONTS[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (fontId) => {
    onChange(fontId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-black border border-white text-white text-left flex items-center justify-between gap-2 hover:bg-white/10 transition-colors"
      >
        <span className={`${selectedFont.className} truncate text-sm`}>
          {selectedFont.name}
        </span>
        <svg 
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute top-full left-0 right-0 mt-1 bg-black border border-white z-50 overflow-hidden transition-all duration-150 origin-top ${
          isOpen 
            ? 'opacity-100 scale-y-100 translate-y-0' 
            : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none'
        }`}
      >
        {FONTS.map((font) => (
          <button
            key={font.id}
            onClick={() => handleSelect(font.id)}
            className={`w-full px-3 py-2 text-white text-left hover:bg-white/20 transition-colors flex items-center gap-2 ${
              font.id === value ? 'bg-white/10' : ''
            }`}
          >
            <span className={`${font.className} text-sm`}>
              {font.name}
            </span>
            {font.id === value && (
              <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export { FONTS };
export default FontDropdown;
