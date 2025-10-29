# Hex Battle Arena - Turn-Based Combat Game

A browser-based turn-based 5v5 tactical combat game featuring a hexagonal battlefield where your team of heroes battles against enemy forces!

## Features

- **5v5 Team Combat** - Command a team of 5 heroes against 5 enemy units
- **Hexagonal Battlefield** - 9 rows x 15 columns hex grid battleground
- **HUD Overlays** - Real-time unit stats displayed above each character on the battlefield
- **Tactical Movement System** - Two-phase turns with movement and combat
- **Positioned Combat** - Characters occupy specific hexagons on the battlefield
- **Range-Based Damage** - Distance affects attack effectiveness
- **Engagement Mechanics** - Adjacent enemies limit movement options
- **Stationary Bonus** - Units that don't move gain +25% attack damage
- **Multiple actions**:
  - **Move** - Navigate the battlefield (4 hexes per turn)
  - **Attack** - Deal damage to enemies with visual attack animations
  - **Defend** - Reduce incoming damage by 50% on the next turn
  - **Special Attack** - Deal 1.5x damage (with 3-turn cooldown)
- **Animated UI** - Health bars, damage effects, attack lunges, and battle animations
- **Visual Indicators** - See available movement hexes and attack ranges
- **Combat log** - Track all actions during battle
- **Smart AI** - Enemy uses strategic positioning and tactical decisions
- **Responsive design** - Works on desktop and mobile devices

## How to Play

1. Open `index.html` in your web browser
2. **Movement Phase**: Click on a highlighted hex to move, or click "Skip Movement" to stay
3. **Combat Phase**: Choose to Attack, Defend, or use Special Attack
4. Defeat the enemy by reducing their HP to 0
5. Click "New Game" to restart the battle

## Game Mechanics

### Basic Stats
- **HP (Health Points)**: When reduced to 0, the character is defeated
- **ATK (Attack Power)**: Base damage dealt to opponents
- **DEF (Defense)**: Reduces incoming damage
- **Movement Range**: 4 hexes per turn (reduced when engaged)

### Turn Structure
Each turn consists of two phases:
1. **Movement Phase**: Move up to 4 hexes or skip movement
2. **Combat Phase**: Choose an action (Attack, Defend, or Special Attack)

### Movement System
- **Normal Movement**: Move up to 4 hexes in any direction
- **Engaged Status**: When adjacent to an enemy, you are "engaged"
- **Disengagement Penalty**: 50% movement reduction when engaged (2 hexes instead of 4)
- **Blocked Movement**: Cannot move through enemy-occupied hexes
- **Visual Indicators**: Green pulsing hexes show available movement

### Combat & Range
- **Adjacent Range (1 hex)**: Full damage - 100% effectiveness
- **Close Range (2 hexes)**: Reduced damage - 40% effectiveness (60% penalty)
- **Out of Range (3+ hexes)**: Cannot attack
- **Defending**: Reduces next attack damage by 50%
- **Special Attack**: Deals 1.5x damage, 3-turn cooldown, same range rules apply

### Engagement
- **Engaged**: Characters are engaged when in adjacent hexes
- **Movement Penalty**: Engaged characters move only 2 hexes (50% penalty)
- **Status Display**: "⚔️ ENGAGED" shown in character info panel

## Files

- `index.html` - Main game structure
- `styles.css` - Styling and animations
- `game.js` - Game logic and mechanics

## Technologies Used

- HTML5
- CSS3 (with animations and gradients)
- Vanilla JavaScript (ES6 Classes)

Enjoy the battle!
