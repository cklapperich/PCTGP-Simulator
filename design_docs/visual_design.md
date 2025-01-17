# Retro Game UI Style Guide

## Core Color Palette
```css
/* Base Colors */
--color-bg-primary: black;
--color-text-primary: white;
--color-text-secondary: rgb(156 163 175); /* gray-400 */
--color-highlight: white;
--color-highlight-bg: rgb(31 41 55); /* gray-800 */

/* Border Colors */
--color-border-primary: white;
--color-border-secondary: rgb(75 85 99); /* gray-600 */
```

## Container Types

### Primary Window
- Black background
- 2px white border
- No rounded corners
- 8px (p-2) padding
```css
.retro-window {
  @apply bg-black border-2 border-white p-2;
}
```

### Secondary Panel
- Dark gray background
- 1px white border
```css
.retro-panel {
  @apply bg-gray-800 border border-white;
}
```

## Text Styles

### Base Text
- Monospace font
- No anti-aliasing
- Clear spacing
```css
.retro-text {
  @apply font-mono text-white;
}

.retro-text-secondary {
  @apply font-mono text-gray-400;
}
```

### Headers
- Simple, all-caps
- No special decoration
```css
.retro-header {
  @apply font-mono text-white uppercase mb-4;
}
```

## Interactive Elements

### Menu Items
- No border in default state
- White text on black
- Inverted colors when selected
```css
.retro-menu-item {
  @apply cursor-pointer p-1 text-white hover:bg-gray-800;
}

.retro-menu-item-selected {
  @apply bg-white text-black;
}
```

### Buttons
```css
.retro-button {
  /* Default State */
  @apply bg-black cursor-pointer;
  @apply border-l-2 border-t-2 border-white;
  @apply border-r border-b border-gray-600;

  /* Pressed State */
  &:active {
    @apply border-l border-t border-gray-600;
    @apply border-r-2 border-b-2 border-white;
  }
}
```

## Layout Patterns

### Menu + Info Panel
```css
.retro-layout-split {
  @apply flex gap-4;
}

.retro-menu-column {
  @apply w-64;
}

.retro-info-panel {
  @apply w-96;
}
```

## Selection Indicators
- Simple '>' character for selected items
- No animations or transitions
```css
.retro-selector {
  content: '>';
  @apply mr-1;
}
```

## Grid Layouts
```css
.retro-grid {
  @apply grid gap-1;
}

.retro-grid-item {
  @apply border border-white p-1;
}
```

## Animation Guidelines
1. No smooth transitions or effects
2. Use instant state changes
3. For "animations", use 2-4 frame steps
4. Keep any movement snapped to pixel grid

## Sound Guidelines
1. Short 'blip' for navigation (100-200ms)
2. Distinct 'confirm' sound (slightly longer, 200-300ms)
3. Keep volume between 0.2-0.4
4. No simultaneous sounds

## Spacing Guidelines
1. Use multiples of 4px (p-1, p-2, etc.)
2. Consistent 16px (p-4) gap between major sections
3. 8px (p-2) padding inside containers
4. 4px (p-1) padding for menu items

## Usage Examples

### Basic Window
```jsx
<div className="retro-window">
  <div className="retro-header">Window Title</div>
  <div className="retro-text">Content goes here</div>
</div>
```

### Menu Item
```jsx
<div className={`retro-menu-item ${isSelected ? 'retro-menu-item-selected' : ''}`}>
  {isSelected ? '> ' : '  '}Menu Option
</div>
```

### Button
```jsx
<button className="retro-button">
  <span className="px-4 py-1">Click Me</span>
</button>
```

## Visual styles

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
