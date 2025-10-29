# Turn-Based Combat Game

A simple browser-based turn-based combat game where you battle against a Dark Knight!

## Features

- **Turn-based combat system** - Take turns attacking the enemy
- **Multiple actions**:
  - **Attack** - Deal damage to the enemy
  - **Defend** - Reduce incoming damage by 50% on the next turn
  - **Special Attack** - Deal 1.5x damage (with 3-turn cooldown)
- **Animated UI** - Health bars, damage effects, and battle animations
- **Combat log** - Track all actions during battle
- **Smart AI** - Enemy uses tactics based on current battle conditions
- **Responsive design** - Works on desktop and mobile devices

## How to Play

1. Open `index.html` in your web browser
2. Click action buttons to attack, defend, or use special abilities
3. Defeat the enemy by reducing their HP to 0
4. Click "New Game" to restart the battle

## Game Mechanics

- **HP (Health Points)**: When reduced to 0, the character is defeated
- **ATK (Attack Power)**: Base damage dealt to opponents
- **DEF (Defense)**: Reduces incoming damage
- **Defending**: Reduces next attack damage by 50%
- **Special Attack**: Deals 1.5x damage but has a 3-turn cooldown

## Files

- `index.html` - Main game structure
- `styles.css` - Styling and animations
- `game.js` - Game logic and mechanics

## Technologies Used

- HTML5
- CSS3 (with animations and gradients)
- Vanilla JavaScript (ES6 Classes)

Enjoy the battle!
