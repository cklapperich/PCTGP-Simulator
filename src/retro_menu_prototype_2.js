import React, { useState, useEffect } from 'react';

const OpponentSelect = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const opponents = [
    {
      name: 'Professor Oak',
      title: 'Pokemon Researcher',
      deckType: 'Normal Type',
      difficulty: 'Easy',
      description: 'A well-balanced deck focused on basic Pokemon and evolution chains.',
      strategy: 'Builds up powerful evolved Pokemon over time.'
    },
    {
      name: 'Misty',
      title: 'Water Gym Leader',
      deckType: 'Water Type',
      difficulty: 'Medium',
      description: 'Specializes in Water-type Pokemon with strong defensive tactics.',
      strategy: 'Controls the game through status effects and healing.'
    },
    {
      name: 'Lt. Surge',
      title: 'Electric Gym Leader',
      deckType: 'Electric Type',
      difficulty: 'Hard',
      description: 'Aggressive deck focusing on quick damage and paralysis effects.',
      strategy: 'Aims to win through early pressure and status conditions.'
    }
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (e.key === 'ArrowDown' && selectedIndex < opponents.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  return (
    <div className="flex gap-4 font-mono">
      {/* Left Menu */}
      <div className="w-64 bg-black border-2 border-white p-2">
        <div className="text-white mb-4">SELECT OPPONENT</div>
        <ul className="m-0 p-0">
          {opponents.map((opponent, index) => (
            <li
              key={opponent.name}
              className={`
                cursor-pointer 
                p-1
                ${selectedIndex === index ? 
                  'bg-white text-black' : 
                  'text-white hover:bg-gray-800'
                }
              `}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {selectedIndex === index ? '>' : ' '} {opponent.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Right Info Panel */}
      <div className="w-96 bg-black border-2 border-white p-2 text-white">
        <div className="h-32 bg-gray-800 mb-4 flex items-center justify-center border border-white">
          [Portrait Placeholder]
        </div>
        
        <div className="space-y-2">
          <div className="border-b border-white pb-1">
            <div className="text-lg">{opponents[selectedIndex].name}</div>
            <div className="text-gray-400">{opponents[selectedIndex].title}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            <div>Deck Type:</div>
            <div>{opponents[selectedIndex].deckType}</div>
            <div>Difficulty:</div>
            <div>{opponents[selectedIndex].difficulty}</div>
          </div>
          
          <div className="border-t border-white pt-1">
            <div className="mb-1">Strategy:</div>
            <div className="text-gray-400 text-sm">
              {opponents[selectedIndex].strategy}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentSelect;