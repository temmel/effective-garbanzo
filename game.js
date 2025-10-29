// Character Class
class Character {
    constructor(name, hp, attack, defense, sprite, moveRange = 4, id = 0) {
        this.name = name;
        this.maxHp = hp;
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.sprite = sprite;
        this.moveRange = moveRange;
        this.isDefending = false;
        this.row = 0;
        this.col = 0;
        this.id = id;
        this.hasActedThisTurn = false;
        this.movedThisTurn = false;
    }

    takeDamage(damage, distancePenalty = 1.0) {
        // Apply distance penalty before defense
        let baseDamage = Math.floor(damage * distancePenalty);
        let actualDamage = Math.max(1, baseDamage - this.defense);

        if (this.isDefending) {
            actualDamage = Math.floor(actualDamage * 0.5);
        }

        this.hp = Math.max(0, this.hp - actualDamage);
        this.isDefending = false;

        return actualDamage;
    }

    attackTarget(target, distance) {
        let baseDamage = this.attack + Math.floor(Math.random() * 6) - 2;

        // Stationary combat bonus: +25% if didn't move
        if (!this.movedThisTurn) {
            baseDamage = Math.floor(baseDamage * 1.25);
        }

        const penalty = this.getDistancePenalty(distance);
        return target.takeDamage(baseDamage, penalty);
    }

    specialAttack(target, distance) {
        let baseDamage = Math.floor(this.attack * 1.5) + Math.floor(Math.random() * 8) - 2;

        // Stationary combat bonus: +25% if didn't move
        if (!this.movedThisTurn) {
            baseDamage = Math.floor(baseDamage * 1.25);
        }

        const penalty = this.getDistancePenalty(distance);
        return target.takeDamage(baseDamage, penalty);
    }

    getDistancePenalty(distance) {
        if (distance === 1) return 1.0;  // Adjacent - full damage
        if (distance === 2) return 0.4;  // 1 hex away - 60% penalty
        return 0;  // Too far - can't attack
    }

    canAttackAtDistance(distance) {
        return distance <= 2;
    }

    defend() {
        this.isDefending = true;
    }

    isAlive() {
        return this.hp > 0;
    }

    getHpPercentage() {
        return (this.hp / this.maxHp) * 100;
    }

    setPosition(row, col) {
        this.row = row;
        this.col = col;
    }

    resetTurnState() {
        this.hasActedThisTurn = false;
        this.movedThisTurn = false;
    }

    markAsActed() {
        this.hasActedThisTurn = true;
    }
}

// Hexagonal Grid Class
class HexGrid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.hexElements = [];
        this.initializeGrid();
    }

    initializeGrid() {
        const gridContainer = document.getElementById('hex-grid');
        gridContainer.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            const hexRow = document.createElement('div');
            hexRow.className = 'hex-row';

            // Offset odd rows for hexagonal pattern
            if (row % 2 === 1) {
                hexRow.classList.add('even');
            }

            const rowElements = [];

            for (let col = 0; col < this.cols; col++) {
                const hexagon = document.createElement('div');
                hexagon.className = 'hexagon';
                hexagon.dataset.row = row;
                hexagon.dataset.col = col;

                // Add the hexagon shape background
                const hexShape = document.createElement('div');
                hexShape.className = 'hexagon-shape';
                hexagon.appendChild(hexShape);

                hexRow.appendChild(hexagon);
                rowElements.push(hexagon);
            }

            gridContainer.appendChild(hexRow);
            this.hexElements.push(rowElements);
        }
    }

    // Convert offset coordinates to axial coordinates for distance calculation
    offsetToAxial(row, col) {
        const q = col - Math.floor(row / 2);
        const r = row;
        return { q, r };
    }

    // Calculate hexagonal distance between two hexes
    hexDistance(row1, col1, row2, col2) {
        const a = this.offsetToAxial(row1, col1);
        const b = this.offsetToAxial(row2, col2);

        return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    }

    // Get all hexes within range that are reachable
    getReachableHexes(fromRow, fromCol, range, blockedPositions = []) {
        const reachable = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // Skip if blocked
                const isBlocked = blockedPositions.some(pos => pos.row === row && pos.col === col);
                if (isBlocked) continue;

                // Skip starting position
                if (row === fromRow && col === fromCol) continue;

                const distance = this.hexDistance(fromRow, fromCol, row, col);
                if (distance <= range) {
                    reachable.push({ row, col, distance });
                }
            }
        }

        return reachable;
    }

    getHexElement(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.hexElements[row][col];
        }
        return null;
    }

    clearHex(row, col) {
        const hex = this.getHexElement(row, col);
        if (hex) {
            hex.classList.remove('player-occupied', 'enemy-occupied', 'selected-unit');
            hex.innerHTML = '';
        }
    }

    clearHighlights() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const hex = this.getHexElement(row, col);
                if (hex) {
                    hex.classList.remove('available-move', 'in-range', 'out-of-range', 'targetable-enemy');
                }
            }
        }
    }

    highlightReachableHexes(hexes) {
        this.clearHighlights();
        hexes.forEach(({ row, col }) => {
            const hex = this.getHexElement(row, col);
            if (hex) {
                hex.classList.add('available-move');
            }
        });
    }

    highlightTargetableEnemies(enemies, fromRow, fromCol) {
        enemies.forEach(enemy => {
            if (!enemy.isAlive()) return;

            const distance = this.hexDistance(fromRow, fromCol, enemy.row, enemy.col);
            const hex = this.getHexElement(enemy.row, enemy.col);

            if (hex && distance <= 2) {
                hex.classList.add('targetable-enemy');
            }
        });
    }

    placeCharacter(character, row, col, isPlayer) {
        this.clearHex(character.row, character.col);

        character.setPosition(row, col);
        const hex = this.getHexElement(row, col);

        if (hex) {
            hex.classList.add(isPlayer ? 'player-occupied' : 'enemy-occupied');

            const charSprite = document.createElement('div');
            charSprite.className = 'hexagon-character';
            charSprite.textContent = character.sprite;
            charSprite.dataset.unitId = character.id;
            charSprite.dataset.isPlayer = isPlayer;
            hex.appendChild(charSprite);

            // Add HUD overlay
            this.createHUD(character, hex, isPlayer);
        }
    }

    createHUD(character, hex, isPlayer) {
        const hud = document.createElement('div');
        hud.className = 'unit-hud';
        hud.dataset.unitId = character.id;

        const hpPercent = character.getHpPercentage();
        let hpColor = '#48bb78';
        if (hpPercent < 30) hpColor = '#e53e3e';
        else if (hpPercent < 60) hpColor = '#ed8936';

        let statusIcons = '';
        if (character.hasActedThisTurn && character.isAlive()) statusIcons += '✓ ';
        if (character.isDefending) statusIcons += '🛡️ ';

        hud.innerHTML = `
            <div class="hud-name">${character.name}</div>
            <div class="hud-hp-container">
                <div class="hud-hp-bar" style="width: ${hpPercent}%; background: ${hpColor};"></div>
            </div>
            <div class="hud-hp-text">${character.hp}/${character.maxHp}</div>
            ${statusIcons ? `<div class="hud-status">${statusIcons}</div>` : ''}
        `;

        hex.appendChild(hud);
    }

    updateHUD(character) {
        const hex = this.getHexElement(character.row, character.col);
        if (!hex) return;

        const hud = hex.querySelector('.unit-hud');
        if (!hud) return;

        const hpPercent = character.getHpPercentage();
        let hpColor = '#48bb78';
        if (hpPercent < 30) hpColor = '#e53e3e';
        else if (hpPercent < 60) hpColor = '#ed8936';

        let statusIcons = '';
        if (character.hasActedThisTurn && character.isAlive()) statusIcons += '✓ ';
        if (character.isDefending) statusIcons += '🛡️ ';

        hud.innerHTML = `
            <div class="hud-name">${character.name}</div>
            <div class="hud-hp-container">
                <div class="hud-hp-bar" style="width: ${hpPercent}%; background: ${hpColor};"></div>
            </div>
            <div class="hud-hp-text">${character.hp}/${character.maxHp}</div>
            ${statusIcons ? `<div class="hud-status">${statusIcons}</div>` : ''}
        `;
    }

    markUnitAsSelected(character) {
        const hex = this.getHexElement(character.row, character.col);
        if (hex) {
            hex.classList.add('selected-unit');
        }
    }

    flashHex(row, col) {
        const hex = this.getHexElement(row, col);
        if (hex) {
            hex.classList.add('damage-flash');
            setTimeout(() => hex.classList.remove('damage-flash'), 500);
        }
    }

    animateAttack(fromRow, fromCol, toRow, toCol) {
        const fromHex = this.getHexElement(fromRow, fromCol);
        if (fromHex) {
            const character = fromHex.querySelector('.hexagon-character');
            if (character) {
                character.classList.add('attack-animation');
                setTimeout(() => character.classList.remove('attack-animation'), 500);
            }
        }

        setTimeout(() => this.flashHex(toRow, toCol), 200);
    }
}

// Game State
class Game {
    constructor() {
        // Create 5 player units and 5 enemy units
        this.playerUnits = [];
        this.enemyUnits = [];

        for (let i = 0; i < 5; i++) {
            this.playerUnits.push(new Character(`Hero ${i + 1}`, 100, 35, 5, "🧙‍♂️", 4, `player-${i}`));
            this.enemyUnits.push(new Character(`Dark Knight ${i + 1}`, 100, 32, 4, "🧟", 4, `enemy-${i}`));
        }

        this.isPlayerTurn = true;
        this.gameOver = false;
        this.specialCooldown = 0;
        this.turnCount = 0;

        // Phase and unit selection tracking
        this.currentPhase = "unitSelection"; // "unitSelection", "movement", "combat", "targeting"
        this.selectedUnit = null;
        this.targetEnemy = null;

        // Create hex grid (9 rows x 15 columns)
        this.hexGrid = new HexGrid(9, 15);

        // Position units on the grid
        this.positionStartingUnits();

        this.initializeUI();
        this.attachEventListeners();
        this.updateUI();
        this.addLog("⚔️ Battle begins! Select a unit to act.", "system");
    }

    positionStartingUnits() {
        // Position player units on left side (column 1)
        const playerPositions = [
            { row: 1, col: 1 },
            { row: 3, col: 1 },
            { row: 4, col: 1 },
            { row: 5, col: 1 },
            { row: 7, col: 1 }
        ];

        // Position enemy units on right side (column 13)
        const enemyPositions = [
            { row: 1, col: 13 },
            { row: 3, col: 13 },
            { row: 4, col: 13 },
            { row: 5, col: 13 },
            { row: 7, col: 13 }
        ];

        this.playerUnits.forEach((unit, index) => {
            const pos = playerPositions[index];
            this.hexGrid.placeCharacter(unit, pos.row, pos.col, true);
        });

        this.enemyUnits.forEach((unit, index) => {
            const pos = enemyPositions[index];
            this.hexGrid.placeCharacter(unit, pos.row, pos.col, false);
        });
    }

    initializeUI() {
        this.turnIndicator = document.getElementById("turn-indicator");
        this.logMessages = document.getElementById("log-messages");

        this.attackBtn = document.getElementById("attack-btn");
        this.defendBtn = document.getElementById("defend-btn");
        this.specialBtn = document.getElementById("special-btn");
        this.skipMoveBtn = document.getElementById("skip-move-btn");
        this.resetBtn = document.getElementById("reset-btn");
    }

    attachEventListeners() {
        this.attackBtn.addEventListener("click", () => this.playerAction("attack"));
        this.defendBtn.addEventListener("click", () => this.playerAction("defend"));
        this.specialBtn.addEventListener("click", () => this.playerAction("special"));
        this.skipMoveBtn.addEventListener("click", () => this.skipMovement());
        this.resetBtn.addEventListener("click", () => this.resetGame());

        // Add click handlers for unit selection on hex grid
        this.addUnitSelectionHandlers();
    }

    addUnitSelectionHandlers() {
        for (let row = 0; row < this.hexGrid.rows; row++) {
            for (let col = 0; col < this.hexGrid.cols; col++) {
                const hex = this.hexGrid.getHexElement(row, col);
                if (hex) {
                    hex.addEventListener('click', (e) => this.handleHexClick(row, col, e));
                }
            }
        }
    }

    handleHexClick(row, col, event) {
        // Check if clicking on a player unit for selection
        if (this.currentPhase === "unitSelection" && this.isPlayerTurn) {
            const unit = this.playerUnits.find(u => u.row === row && u.col === col && u.isAlive() && !u.hasActedThisTurn);
            if (unit) {
                this.selectUnit(unit);
                return;
            }
        }

        // Check if clicking on movement hex
        if (this.currentPhase === "movement" && event.target.closest('.hexagon').classList.contains('available-move')) {
            this.movePlayerTo(row, col);
            return;
        }

        // Check if clicking on targetable enemy
        if (this.currentPhase === "targeting") {
            const enemy = this.enemyUnits.find(u => u.row === row && u.col === col && u.isAlive());
            if (enemy && event.target.closest('.hexagon').classList.contains('targetable-enemy')) {
                this.selectTarget(enemy);
                return;
            }
        }
    }

    selectUnit(unit) {
        this.selectedUnit = unit;
        this.hexGrid.clearHighlights();

        // Remove all selected-unit classes
        for (let row = 0; row < this.hexGrid.rows; row++) {
            for (let col = 0; col < this.hexGrid.cols; col++) {
                const hex = this.hexGrid.getHexElement(row, col);
                if (hex) hex.classList.remove('selected-unit');
            }
        }

        this.hexGrid.markUnitAsSelected(unit);
        this.addLog(`Selected ${unit.name}`, "player-action");
        this.startMovementPhase();
    }

    startMovementPhase() {
        this.currentPhase = "movement";

        // Check if unit is engaged (adjacent to any enemy)
        let closestEnemyDistance = Infinity;
        this.enemyUnits.forEach(enemy => {
            if (!enemy.isAlive()) return;
            const dist = this.hexGrid.hexDistance(
                this.selectedUnit.row, this.selectedUnit.col,
                enemy.row, enemy.col
            );
            closestEnemyDistance = Math.min(closestEnemyDistance, dist);
        });

        const isEngaged = closestEnemyDistance === 1;
        const effectiveRange = isEngaged ? Math.floor(this.selectedUnit.moveRange * 0.5) : this.selectedUnit.moveRange;

        if (isEngaged) {
            this.addLog(`${this.selectedUnit.name} is ENGAGED! Movement reduced to ${effectiveRange}`, "system");
        }

        // Get all occupied positions
        const blockedPositions = [];
        this.playerUnits.forEach(u => { if (u.isAlive() && u !== this.selectedUnit) blockedPositions.push({ row: u.row, col: u.col }); });
        this.enemyUnits.forEach(u => { if (u.isAlive()) blockedPositions.push({ row: u.row, col: u.col }); });

        // Show available movement hexes
        const reachableHexes = this.hexGrid.getReachableHexes(
            this.selectedUnit.row,
            this.selectedUnit.col,
            effectiveRange,
            blockedPositions
        );

        this.hexGrid.highlightReachableHexes(reachableHexes);
        this.updateUI();
    }

    movePlayerTo(row, col) {
        const distance = this.hexGrid.hexDistance(this.selectedUnit.row, this.selectedUnit.col, row, col);
        this.addLog(`${this.selectedUnit.name} moves ${distance} hex${distance > 1 ? 'es' : ''}`, "player-action");

        this.selectedUnit.movedThisTurn = true;
        this.hexGrid.placeCharacter(this.selectedUnit, row, col, true);
        this.hexGrid.markUnitAsSelected(this.selectedUnit);
        this.startCombatPhase();
    }

    skipMovement() {
        if (this.currentPhase !== "movement") return;

        this.addLog(`${this.selectedUnit.name} stays in position`, "player-action");
        this.startCombatPhase();
    }

    startCombatPhase() {
        this.currentPhase = "combat";
        this.hexGrid.clearHighlights();
        this.hexGrid.markUnitAsSelected(this.selectedUnit);

        this.turnCount++;
        this.addLog(`Combat Phase - Choose action for ${this.selectedUnit.name}`, "system");
        this.updateUI();
    }

    playerAction(action) {
        if (this.currentPhase !== "combat" || !this.isPlayerTurn || this.gameOver || !this.selectedUnit) return;

        if (action === "defend") {
            this.selectedUnit.defend();
            this.addLog(`${this.selectedUnit.name} braces for attack!`, "player-action");
            this.finishUnitTurn();
            return;
        }

        // For attack and special, need to select target
        this.pendingAction = action;
        this.currentPhase = "targeting";
        this.hexGrid.highlightTargetableEnemies(this.enemyUnits, this.selectedUnit.row, this.selectedUnit.col);
        this.addLog("Select an enemy to target", "system");
        this.updateUI();
    }

    selectTarget(enemy) {
        this.targetEnemy = enemy;

        const distance = this.hexGrid.hexDistance(
            this.selectedUnit.row, this.selectedUnit.col,
            this.targetEnemy.row, this.targetEnemy.col
        );

        if (!this.selectedUnit.canAttackAtDistance(distance)) {
            this.addLog("❌ Enemy is too far away!", "system");
            this.currentPhase = "combat";
            this.hexGrid.clearHighlights();
            this.updateUI();
            return;
        }

        // Execute the pending action
        switch(this.pendingAction) {
            case "attack":
                const damage = this.selectedUnit.attackTarget(this.targetEnemy, distance);
                const rangeText = distance === 1 ? "full" : "reduced";
                const stationaryText = !this.selectedUnit.movedThisTurn ? " +STATIONARY BONUS" : "";
                this.addLog(`${this.selectedUnit.name} attacks ${this.targetEnemy.name} for ${damage} damage (${rangeText})${stationaryText}!`, "player-action");
                this.hexGrid.animateAttack(
                    this.selectedUnit.row, this.selectedUnit.col,
                    this.targetEnemy.row, this.targetEnemy.col
                );
                break;

            case "special":
                if (this.specialCooldown > 0) {
                    this.addLog("Special attack on cooldown!", "system");
                    this.currentPhase = "combat";
                    this.hexGrid.clearHighlights();
                    this.updateUI();
                    return;
                }

                const specialDamage = this.selectedUnit.specialAttack(this.targetEnemy, distance);
                const specialRangeText = distance === 1 ? "full" : "reduced";
                const specialStationaryText = !this.selectedUnit.movedThisTurn ? " +STATIONARY BONUS" : "";
                this.addLog(`${this.selectedUnit.name} SPECIAL ATTACK on ${this.targetEnemy.name} for ${specialDamage} damage (${specialRangeText})${specialStationaryText}!`, "player-action");
                this.hexGrid.animateAttack(
                    this.selectedUnit.row, this.selectedUnit.col,
                    this.targetEnemy.row, this.targetEnemy.col
                );
                this.specialCooldown = 3;
                break;
        }

        this.finishUnitTurn();
    }

    finishUnitTurn() {
        this.selectedUnit.markAsActed();
        this.hexGrid.clearHighlights();

        // Remove dead enemies from grid
        this.enemyUnits.forEach(enemy => {
            if (!enemy.isAlive()) {
                this.hexGrid.clearHex(enemy.row, enemy.col);
            }
        });

        this.updateUI();

        // Check if all enemies dead
        if (this.enemyUnits.every(u => !u.isAlive())) {
            this.endGame(true);
            return;
        }

        // Check if all player units have acted
        const allActed = this.playerUnits.filter(u => u.isAlive()).every(u => u.hasActedThisTurn);

        if (allActed) {
            this.isPlayerTurn = false;
            this.disableButtons();
            setTimeout(() => this.enemyTeamTurn(), 1500);
        } else {
            this.currentPhase = "unitSelection";
            this.selectedUnit = null;
            this.addLog("Select next unit to act", "system");
            this.updateUI();
        }
    }

    enemyTeamTurn() {
        if (this.gameOver) return;

        this.addLog("💀 Enemy Team Turn", "enemy-action");

        // Reset enemy unit states
        this.enemyUnits.forEach(u => u.resetTurnState());

        // Process each living enemy unit
        const livingEnemies = this.enemyUnits.filter(u => u.isAlive());
        this.currentEnemyIndex = 0;

        this.processNextEnemyUnit(livingEnemies);
    }

    processNextEnemyUnit(livingEnemies) {
        if (this.currentEnemyIndex >= livingEnemies.length) {
            // All enemies done, back to player turn
            this.playerUnits.forEach(u => u.resetTurnState());
            this.isPlayerTurn = true;
            this.currentPhase = "unitSelection";

            if (this.specialCooldown > 0) {
                this.specialCooldown--;
            }

            setTimeout(() => {
                this.addLog("Your turn! Select a unit to act.", "system");
                this.updateUI();
            }, 1000);
            return;
        }

        const enemy = livingEnemies[this.currentEnemyIndex];
        this.currentEnemyIndex++;

        // Enemy movement
        this.enemyMovementPhase(enemy, () => {
            // Enemy combat
            this.enemyCombatPhase(enemy, () => {
                // Process next enemy after delay
                setTimeout(() => this.processNextEnemyUnit(livingEnemies), 800);
            });
        });
    }

    enemyMovementPhase(enemy, callback) {
        // Find closest player
        let closestPlayer = null;
        let minDistance = Infinity;

        this.playerUnits.forEach(player => {
            if (!player.isAlive()) return;
            const dist = this.hexGrid.hexDistance(enemy.row, enemy.col, player.row, player.col);
            if (dist < minDistance) {
                minDistance = dist;
                closestPlayer = player;
            }
        });

        if (!closestPlayer) {
            callback();
            return;
        }

        const isEngaged = minDistance === 1;
        const effectiveRange = isEngaged ? Math.floor(enemy.moveRange * 0.5) : enemy.moveRange;

        // Get blocked positions
        const blockedPositions = [];
        this.playerUnits.forEach(u => { if (u.isAlive()) blockedPositions.push({ row: u.row, col: u.col }); });
        this.enemyUnits.forEach(u => { if (u.isAlive() && u !== enemy) blockedPositions.push({ row: u.row, col: u.col }); });

        const reachableHexes = this.hexGrid.getReachableHexes(
            enemy.row, enemy.col,
            effectiveRange,
            blockedPositions
        );

        let bestMove = { row: enemy.row, col: enemy.col };

        if (minDistance > 1) {
            // Move closer
            let bestDistance = minDistance;
            reachableHexes.forEach(({ row, col }) => {
                const dist = this.hexGrid.hexDistance(row, col, closestPlayer.row, closestPlayer.col);
                if (dist < bestDistance) {
                    bestDistance = dist;
                    bestMove = { row, col };
                }
            });
        } else if (enemy.getHpPercentage() < 30 && minDistance === 1) {
            // Low health - try to back off
            let bestDistance = 0;
            reachableHexes.forEach(({ row, col }) => {
                const dist = this.hexGrid.hexDistance(row, col, closestPlayer.row, closestPlayer.col);
                if (dist > bestDistance && dist <= 2) {
                    bestDistance = dist;
                    bestMove = { row, col };
                }
            });
        }

        if (bestMove.row !== enemy.row || bestMove.col !== enemy.col) {
            enemy.movedThisTurn = true;
            this.hexGrid.placeCharacter(enemy, bestMove.row, bestMove.col, false);
            this.addLog(`${enemy.name} repositions`, "enemy-action");
        }
        // If didn't move, movedThisTurn stays false (from resetTurnState)

        setTimeout(callback, 500);
    }

    enemyCombatPhase(enemy, callback) {
        // Find target in range
        let target = null;
        let targetDistance = Infinity;

        this.playerUnits.forEach(player => {
            if (!player.isAlive()) return;
            const dist = this.hexGrid.hexDistance(enemy.row, enemy.col, player.row, player.col);
            if (dist <= 2 && dist < targetDistance) {
                targetDistance = dist;
                target = player;
            }
        });

        if (!target) {
            this.addLog(`${enemy.name} cannot reach any target`, "enemy-action");
            setTimeout(callback, 300);
            return;
        }

        // Simple AI action selection
        const enemyHpPercent = enemy.getHpPercentage();
        const random = Math.random();
        let action;

        if (enemyHpPercent < 30 && random < 0.4) {
            action = "defend";
        } else if (random < 0.2) {
            action = "defend";
        } else {
            action = "attack";
        }

        setTimeout(() => {
            if (action === "defend") {
                enemy.defend();
                this.addLog(`${enemy.name} defends`, "enemy-action");
            } else {
                const damage = enemy.attackTarget(target, targetDistance);
                const rangeText = targetDistance === 1 ? "full" : "reduced";
                const stationaryText = !enemy.movedThisTurn ? " +STATIONARY" : "";
                this.addLog(`${enemy.name} attacks ${target.name} for ${damage} damage (${rangeText})${stationaryText}!`, "enemy-action");
                this.hexGrid.animateAttack(enemy.row, enemy.col, target.row, target.col);

                // Remove dead players from grid
                if (!target.isAlive()) {
                    this.hexGrid.clearHex(target.row, target.col);
                    this.addLog(`${target.name} has fallen!`, "system");
                }
            }

            this.updateUI();

            // Check if all players dead
            if (this.playerUnits.every(u => !u.isAlive())) {
                this.endGame(false);
                return;
            }

            callback();
        }, 500);
    }

    updateUI() {
        // Update HUDs for all units
        this.playerUnits.forEach(unit => {
            if (unit.isAlive()) {
                this.hexGrid.updateHUD(unit);
            }
        });
        this.enemyUnits.forEach(unit => {
            if (unit.isAlive()) {
                this.hexGrid.updateHUD(unit);
            }
        });

        // Update turn indicator based on phase
        if (!this.isPlayerTurn) {
            this.turnIndicator.textContent = "⏳ Enemy Team Turn...";
        } else if (this.currentPhase === "unitSelection") {
            this.turnIndicator.textContent = "👥 Select Unit to Act";
        } else if (this.currentPhase === "movement") {
            this.turnIndicator.textContent = `👣 ${this.selectedUnit?.name} - Movement Phase`;
        } else if (this.currentPhase === "combat") {
            this.turnIndicator.textContent = `⚔️ ${this.selectedUnit?.name} - Combat Phase`;
        } else if (this.currentPhase === "targeting") {
            this.turnIndicator.textContent = `🎯 ${this.selectedUnit?.name} - Select Target`;
        }

        // Show/hide buttons based on phase
        const isCombatPhase = this.currentPhase === "combat";
        const isMovementPhase = this.currentPhase === "movement";

        this.attackBtn.style.display = isCombatPhase ? "flex" : "none";
        this.defendBtn.style.display = isCombatPhase ? "flex" : "none";
        this.specialBtn.style.display = isCombatPhase ? "flex" : "none";
        this.skipMoveBtn.style.display = isMovementPhase && this.isPlayerTurn ? "flex" : "none";

        if ((isCombatPhase || isMovementPhase) && this.isPlayerTurn) {
            this.enableButtons();
        } else {
            this.disableButtons();
        }

        // Update special button cooldown
        if (this.specialCooldown > 0) {
            this.specialBtn.innerHTML = `
                ✨ Special Attack
                <span class="btn-desc">Cooldown: ${this.specialCooldown} turns</span>
            `;
        } else {
            this.specialBtn.innerHTML = `
                ✨ Special Attack
                <span class="btn-desc">Deal 1.5x damage (3 turn cooldown)</span>
            `;
        }
    }

    addLog(message, type = "") {
        const logEntry = document.createElement("div");
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        this.logMessages.insertBefore(logEntry, this.logMessages.firstChild);

        // Keep only last 15 messages
        while (this.logMessages.children.length > 15) {
            this.logMessages.removeChild(this.logMessages.lastChild);
        }
    }

    disableButtons() {
        this.attackBtn.disabled = true;
        this.defendBtn.disabled = true;
        this.specialBtn.disabled = true;
        this.skipMoveBtn.disabled = true;
    }

    enableButtons() {
        if (this.currentPhase === "combat") {
            this.attackBtn.disabled = false;
            this.defendBtn.disabled = false;
            this.specialBtn.disabled = this.specialCooldown > 0;
        }
        if (this.currentPhase === "movement") {
            this.skipMoveBtn.disabled = false;
        }
    }

    endGame(playerWon) {
        this.gameOver = true;
        this.disableButtons();
        this.hexGrid.clearHighlights();

        if (playerWon) {
            this.addLog("🎉 VICTORY! All enemies defeated!", "system");
            this.turnIndicator.textContent = "🏆 Victory!";
            this.turnIndicator.style.color = "#38a169";
        } else {
            this.addLog("💀 DEFEAT! Your team has fallen...", "system");
            this.turnIndicator.textContent = "☠️ Defeat...";
            this.turnIndicator.style.color = "#e53e3e";
        }
    }

    resetGame() {
        // Reset turn indicator style
        this.turnIndicator.style.color = "";

        // Clear log
        this.logMessages.innerHTML = "";

        // Create new game instance
        const newGame = new Game();

        // Replace current game with new game
        Object.assign(this, newGame);
    }
}

// Initialize game when page loads
let game;
window.addEventListener("DOMContentLoaded", () => {
    game = new Game();
});
