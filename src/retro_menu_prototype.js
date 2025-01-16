import React, { useState, useEffect } from 'react';

const RetroMenu = ({ variant }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const menuItems = [
    'Start Game',
    'Card Collection',
    'Deck Builder',
    'Options',
    'Exit'
  ];

  // Color schemes using Tailwind colors
  const styles = {
    'white-on-black': {
      container: 'bg-black border-white',
      text: 'text-white',
      selected: 'bg-white text-black',
      hover: 'hover:bg-gray-800'
    },
    'white-on-green': {
      container: 'bg-green-800 border-white',
      text: 'text-white',
      selected: 'bg-white text-green-800',
      hover: 'hover:bg-green-700'
    },
    'green-on-black': {
      container: 'bg-black border-green-400',
      text: 'text-green-400',
      selected: 'bg-green-400 text-black',
      hover: 'hover:bg-green-900'
    }
  };

  const style = styles[variant];

  const handleMenuSelect = (index) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' && selectedIndex > 0) {
      handleMenuSelect(selectedIndex - 1);
    } else if (e.key === 'ArrowDown' && selectedIndex < menuItems.length - 1) {
      handleMenuSelect(selectedIndex + 1);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  return (
    <div className={`w-64 p-2 border-2 ${style.container}`}>
      <div className={`text-xs mb-2 font-mono ${style.text}`}>{variant}</div>
      <ul className="m-0 p-0">
        {menuItems.map((item, index) => (
          <li
            key={item}
            className={`
              cursor-pointer 
              p-1
              font-mono
              ${selectedIndex === index ? 
                style.selected : 
                `${style.text} ${style.hover}`
              }
            `}
            onMouseEnter={() => handleMenuSelect(index)}
          >
            {selectedIndex === index ? '>' : ' '} {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default () => (
  <div className="flex gap-8">
    <RetroMenu variant="white-on-black" />
    <RetroMenu variant="white-on-green" />
    <RetroMenu variant="green-on-black" />
  </div>
);