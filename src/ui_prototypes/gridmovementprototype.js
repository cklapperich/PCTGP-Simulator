import React, { useState, useEffect, useRef } from 'react';

const DIRECTIONS = {
  ArrowUp: { dx: 0, dy: -1, emoji: '⬆️' },
  ArrowDown: { dx: 0, dy: 1, emoji: '⬇️' },
  ArrowLeft: { dx: -1, dy: 0, emoji: '⬅️' },
  ArrowRight: { dx: 1, dy: 0, emoji: '➡️' }
};

const GRID_SIZE = 5;
const TILE_SIZE = 60; 
const MOVEMENT_SPEED = 2;
const KEY_HOLD_THRESHOLD = 100;

const GridLines = ({ size, tileSize }) => (
  <>
    {Array.from({ length: size - 1 }).map((_, i) => (
      <React.Fragment key={i}>
        <div
          className="absolute bg-gray-300"
          style={{
            left: `${(i + 1) * tileSize}px`,
            top: 0,
            width: '1px',
            height: '100%'
          }}
        />
        <div
          className="absolute bg-gray-300"
          style={{
            top: `${(i + 1) * tileSize}px`,
            left: 0,
            height: '1px',
            width: '100%'
          }}
        />
      </React.Fragment>
    ))}
  </>
);

const Character = ({ x, y, direction }) => (
  <div
    className="absolute text-4xl"
    style={{
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)'
    }}
  >
    {direction}
  </div>
);

const GridMovement = () => {
  const [position, setPosition] = useState({ x: TILE_SIZE/2, y: TILE_SIZE/2 });
  const [direction, setDirection] = useState(DIRECTIONS.ArrowRight.emoji);
  const [pressedKeys, setPressedKeys] = useState(new Set());
  
  const refs = {
    animation: useRef(null),
    keyPressTime: useRef({}),
    currentMove: useRef(null),
    isMoving: useRef(false)
  };

  const isValidMove = (gridX, gridY) => 
    gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE;

  const startMovement = (key, currentPos) => {
    const move = DIRECTIONS[key];
    if (!move) return false;

    const currentGridX = Math.floor(currentPos.x / TILE_SIZE);
    const currentGridY = Math.floor(currentPos.y / TILE_SIZE);
    const newGridX = currentGridX + move.dx;
    const newGridY = currentGridY + move.dy;

    if (!isValidMove(newGridX, newGridY)) return false;

    setDirection(move.emoji);
    refs.isMoving.current = true;
    refs.currentMove.current = {
      targetX: (newGridX * TILE_SIZE) + TILE_SIZE/2,
      targetY: (newGridY * TILE_SIZE) + TILE_SIZE/2,
      dx: move.dx,
      dy: move.dy,
      key
    };
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (DIRECTIONS[e.key]) {
        e.preventDefault();
        setPressedKeys(prev => new Set([...prev, e.key]));
        if (!refs.keyPressTime.current[e.key]) {
          refs.keyPressTime.current[e.key] = Date.now();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (DIRECTIONS[e.key]) {
        e.preventDefault();
        const pressTime = refs.keyPressTime.current[e.key];
        const releaseTime = Date.now();
        
        // If key was pressed for less than threshold and we're not moving,
        // just turn to face that direction
        if (pressTime && 
            (releaseTime - pressTime < KEY_HOLD_THRESHOLD) && 
            !refs.isMoving.current) {
          setDirection(DIRECTIONS[e.key].emoji);
        }
        
        setPressedKeys(prev => {
          const next = new Set(prev);
          next.delete(e.key);
          return next;
        });
        delete refs.keyPressTime.current[e.key];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      if (refs.isMoving.current && refs.currentMove.current) {
        const { targetX, targetY, dx, dy, key } = refs.currentMove.current;
        
        setPosition(prev => {
          const newX = prev.x + (dx * MOVEMENT_SPEED);
          const newY = prev.y + (dy * MOVEMENT_SPEED);
          
          const reachedTarget = {
            x: (dx > 0 && newX >= targetX) || (dx < 0 && newX <= targetX) || dx === 0,
            y: (dy > 0 && newY >= targetY) || (dy < 0 && newY <= targetY) || dy === 0
          };

          if (reachedTarget.x && reachedTarget.y) {
            const finalPos = { x: targetX, y: targetY };
            
            const nextKey = Array.from(pressedKeys)[0];
            const keyHeldLongEnough = nextKey && (
              nextKey === key || 
              Date.now() - refs.keyPressTime.current[nextKey] >= KEY_HOLD_THRESHOLD
            );

            if (keyHeldLongEnough) {
              startMovement(nextKey, finalPos);
            } else {
              refs.isMoving.current = false;
              refs.currentMove.current = null;
            }
            
            return finalPos;
          }
          
          return { x: newX, y: newY };
        });
      } else {
        const key = Array.from(pressedKeys)[0];
        const keyPressTime = refs.keyPressTime.current[key];
        
        if (key && keyPressTime && Date.now() - keyPressTime >= KEY_HOLD_THRESHOLD) {
          startMovement(key, position);
        }
      }
      
      refs.animation.current = requestAnimationFrame(animate);
    };

    refs.animation.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(refs.animation.current);
  }, [pressedKeys, position]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative bg-gray-100 border-2 border-gray-300"
        style={{
          width: GRID_SIZE * TILE_SIZE,
          height: GRID_SIZE * TILE_SIZE
        }}
      >
        <GridLines size={GRID_SIZE} tileSize={TILE_SIZE} />
        <Character {...position} direction={direction} />
      </div>
      
      <div className="text-sm text-gray-600">
        Use arrow keys to move. Tap to turn, hold to move.
      </div>
    </div>
  );
};

export default GridMovement;