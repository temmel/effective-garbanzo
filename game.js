// Character Class
class Character {
    constructor(name, hp, attack, defense, sprite, moveRange = 4) {
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
        const baseDamage = this.attack + Math.floor(Math.random() * 6) - 2;
        const penalty = this.getDistancePenalty(distance);
        return target.takeDamage(baseDamage, penalty);
    }

    specialAttack(target, distance) {
        const baseDamage = Math.floor(this.attack * 1.5) + Math.floor(Math.random() * 8) - 2;
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
            hex.classList.remove('player-occupied', 'enemy-occupied');
            hex.innerHTML = '';
        }
    }

    clearHighlights() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const hex = this.getHexElement(row, col);
                if (hex) {
                    hex.classList.remove('available-move', 'in-range', 'out-of-range');
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

    highlightAttackRange(fromRow, fromCol, targetRow, targetCol) {
        const distance = this.hexDistance(fromRow, fromCol, targetRow, targetCol);
        const hex = this.getHexElement(targetRow, targetCol);

        if (hex) {
            if (distance === 1) {
                hex.classList.add('in-range');
            } else if (distance === 2) {
                hex.classList.add('in-range');
            } else {
                hex.classList.add('out-of-range');
            }
        }
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
            hex.appendChild(charSprite);
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
        this.player = new Character("Hero", 100, 20, 5, "🧙‍♂️", 4);
        this.enemy = new Character("Dark Knight", 100, 18, 4, "🧟", 4);
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.specialCooldown = 0;
        this.turnCount = 0;

        // Phase tracking
        this.currentPhase = "movement"; // "movement" or "combat"

        // Create hex grid (9 rows x 20 columns)
        this.hexGrid = new HexGrid(9, 20);

        // Position characters on the grid
        this.hexGrid.placeCharacter(this.player, 4, 3, true);
        this.hexGrid.placeCharacter(this.enemy, 4, 16, false);

        this.initializeUI();
        this.attachEventListeners();
        this.updateUI();
        this.startMovementPhase();
    }

    initializeUI() {
        this.playerHpBar = document.getElementById("player-health-bar");
        this.enemyHpBar = document.getElementById("enemy-health-bar");
        this.playerHpText = document.getElementById("player-hp-text");
        this.enemyHpText = document.getElementById("enemy-hp-text");
        this.playerStatus = document.getElementById("player-status");
        this.enemyStatus = document.getElementById("enemy-status");
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
    }

    startMovementPhase() {
        this.currentPhase = "movement";

        // Check if player is engaged (adjacent to enemy)
        const distance = this.hexGrid.hexDistance(
            this.player.row, this.player.col,
            this.enemy.row, this.enemy.col
        );
        const isEngaged = distance === 1;
        const effectiveRange = isEngaged ? Math.floor(this.player.moveRange * 0.5) : this.player.moveRange;

        if (isEngaged) {
            this.addLog("⚔️ You are ENGAGED! Movement reduced to " + effectiveRange + " hexes", "system");
        } else {
            this.addLog("👣 Movement Phase - Click a hex to move or skip", "system");
        }

        // Show available movement hexes
        const reachableHexes = this.hexGrid.getReachableHexes(
            this.player.row,
            this.player.col,
            effectiveRange,
            [{ row: this.enemy.row, col: this.enemy.col }]
        );

        this.hexGrid.highlightReachableHexes(reachableHexes);

        // Add click handlers to hexes
        this.addHexClickHandlers(reachableHexes);

        this.updateUI();
    }

    addHexClickHandlers(reachableHexes) {
        // Remove old handlers
        this.removeHexClickHandlers();

        // Add handlers for reachable hexes
        reachableHexes.forEach(({ row, col }) => {
            const hex = this.hexGrid.getHexElement(row, col);
            if (hex) {
                const handler = () => this.movePlayerTo(row, col);
                hex.addEventListener('click', handler);
                hex._clickHandler = handler; // Store reference for cleanup
            }
        });
    }

    removeHexClickHandlers() {
        for (let row = 0; row < this.hexGrid.rows; row++) {
            for (let col = 0; col < this.hexGrid.cols; col++) {
                const hex = this.hexGrid.getHexElement(row, col);
                if (hex && hex._clickHandler) {
                    hex.removeEventListener('click', hex._clickHandler);
                    delete hex._clickHandler;
                }
            }
        }
    }

    movePlayerTo(row, col) {
        const distance = this.hexGrid.hexDistance(this.player.row, this.player.col, row, col);
        this.addLog(`👣 You move ${distance} hex${distance > 1 ? 'es' : ''}`, "player-action");

        this.hexGrid.placeCharacter(this.player, row, col, true);
        this.removeHexClickHandlers();
        this.startCombatPhase();
    }

    skipMovement() {
        if (this.currentPhase !== "movement") return;

        this.addLog("👣 You stay in position", "player-action");
        this.removeHexClickHandlers();
        this.startCombatPhase();
    }

    startCombatPhase() {
        this.currentPhase = "combat";
        this.hexGrid.clearHighlights();

        // Highlight enemy to show attack range
        this.hexGrid.highlightAttackRange(
            this.player.row, this.player.col,
            this.enemy.row, this.enemy.col
        );

        this.turnCount++;
        this.addLog("⚔️ Combat Phase - Choose your action", "system");
        this.updateUI();
    }

    playerAction(action) {
        if (this.currentPhase !== "combat" || !this.isPlayerTurn || this.gameOver) return;

        const distance = this.hexGrid.hexDistance(
            this.player.row, this.player.col,
            this.enemy.row, this.enemy.col
        );

        switch(action) {
            case "attack":
                if (!this.player.canAttackAtDistance(distance)) {
                    this.addLog("❌ Enemy is too far away to attack!", "system");
                    return;
                }

                const damage = this.player.attackTarget(this.enemy, distance);
                const rangeText = distance === 1 ? "full" : "reduced";
                this.addLog(`🗡️ You attack for ${damage} damage (${rangeText} range)!`, "player-action");
                this.hexGrid.animateAttack(
                    this.player.row, this.player.col,
                    this.enemy.row, this.enemy.col
                );
                break;

            case "defend":
                this.player.defend();
                this.addLog(`🛡️ You brace for the next attack!`, "player-action");
                break;

            case "special":
                if (this.specialCooldown > 0) return;

                if (!this.player.canAttackAtDistance(distance)) {
                    this.addLog("❌ Enemy is too far away for special attack!", "system");
                    return;
                }

                const specialDamage = this.player.specialAttack(this.enemy, distance);
                const specialRangeText = distance === 1 ? "full" : "reduced";
                this.addLog(`✨ SPECIAL ATTACK for ${specialDamage} damage (${specialRangeText} range)!`, "player-action");
                this.hexGrid.animateAttack(
                    this.player.row, this.player.col,
                    this.enemy.row, this.enemy.col
                );
                this.specialCooldown = 3;
                break;
        }

        this.updateUI();

        if (!this.enemy.isAlive()) {
            this.endGame(true);
            return;
        }

        this.isPlayerTurn = false;
        this.disableButtons();
        this.hexGrid.clearHighlights();

        setTimeout(() => this.enemyTurn(), 1500);
    }

    enemyTurn() {
        if (this.gameOver) return;

        // MOVEMENT PHASE
        const currentDistance = this.hexGrid.hexDistance(
            this.enemy.row, this.enemy.col,
            this.player.row, this.player.col
        );

        // Check if enemy is engaged
        const isEngaged = currentDistance === 1;
        const effectiveRange = isEngaged ? Math.floor(this.enemy.moveRange * 0.5) : this.enemy.moveRange;

        if (isEngaged) {
            this.addLog("💀 Enemy is ENGAGED! Movement reduced", "enemy-action");
        } else {
            this.addLog("💀 Enemy movement phase...", "enemy-action");
        }

        // Strategic movement AI
        let bestMove = { row: this.enemy.row, col: this.enemy.col };

        // Get reachable hexes
        const reachableHexes = this.hexGrid.getReachableHexes(
            this.enemy.row,
            this.enemy.col,
            effectiveRange,
            [{ row: this.player.row, col: this.player.col }]
        );

        // Find best position
        if (currentDistance > 1) {
            // Move closer to attack
            let minDistance = currentDistance;
            reachableHexes.forEach(({ row, col }) => {
                const dist = this.hexGrid.hexDistance(row, col, this.player.row, this.player.col);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestMove = { row, col };
                }
            });
        } else if (this.enemy.getHpPercentage() < 30) {
            // Low health - try to get some distance
            let maxDistance = 0;
            reachableHexes.forEach(({ row, col }) => {
                const dist = this.hexGrid.hexDistance(row, col, this.player.row, this.player.col);
                if (dist > maxDistance && dist <= 2) { // Stay in range but farther
                    maxDistance = dist;
                    bestMove = { row, col };
                }
            });
        }

        if (bestMove.row !== this.enemy.row || bestMove.col !== this.enemy.col) {
            this.hexGrid.placeCharacter(this.enemy, bestMove.row, bestMove.col, false);
            this.addLog("💀 Enemy repositions", "enemy-action");
        } else {
            this.addLog("💀 Enemy holds position", "enemy-action");
        }

        setTimeout(() => this.enemyCombatPhase(), 800);
    }

    enemyCombatPhase() {
        this.addLog("💀 Enemy combat phase...", "enemy-action");

        const distance = this.hexGrid.hexDistance(
            this.enemy.row, this.enemy.col,
            this.player.row, this.player.col
        );

        // Combat AI logic
        const enemyHpPercent = this.enemy.getHpPercentage();
        const playerHpPercent = this.player.getHpPercentage();

        let action;
        const random = Math.random();

        // Can't attack if too far
        const canAttack = this.enemy.canAttackAtDistance(distance);

        if (!canAttack) {
            this.addLog("💀 Enemy is too far to attack!", "enemy-action");
            action = "defend";
        } else if (enemyHpPercent < 30 && random < 0.4) {
            action = "defend";
        } else if (playerHpPercent < 40 && random < 0.3) {
            action = "special";
        } else if (random < 0.15) {
            action = "defend";
        } else if (random < 0.35) {
            action = "special";
        } else {
            action = "attack";
        }

        setTimeout(() => this.executeEnemyAction(action, distance), 500);
    }

    executeEnemyAction(action, distance) {
        switch(action) {
            case "attack":
                const damage = this.enemy.attackTarget(this.player, distance);
                const rangeText = distance === 1 ? "full" : "reduced";
                this.addLog(`💀 Enemy attacks for ${damage} damage (${rangeText} range)!`, "enemy-action");
                this.hexGrid.animateAttack(
                    this.enemy.row, this.enemy.col,
                    this.player.row, this.player.col
                );
                break;

            case "defend":
                this.enemy.defend();
                this.addLog(`🛡️ Enemy prepares to defend!`, "enemy-action");
                break;

            case "special":
                const specialDamage = this.enemy.specialAttack(this.player, distance);
                const specialRangeText = distance === 1 ? "full" : "reduced";
                this.addLog(`💥 Enemy SPECIAL ATTACK for ${specialDamage} damage (${specialRangeText} range)!`, "enemy-action");
                this.hexGrid.animateAttack(
                    this.enemy.row, this.enemy.col,
                    this.player.row, this.player.col
                );
                break;
        }

        this.updateUI();

        if (!this.player.isAlive()) {
            this.endGame(false);
            return;
        }

        this.isPlayerTurn = true;

        if (this.specialCooldown > 0) {
            this.specialCooldown--;
        }

        setTimeout(() => this.startMovementPhase(), 1000);
    }

    updateUI() {
        // Update HP bars
        this.playerHpBar.style.width = this.player.getHpPercentage() + "%";
        this.enemyHpBar.style.width = this.enemy.getHpPercentage() + "%";

        // Update HP text
        this.playerHpText.textContent = `${this.player.hp}/${this.player.maxHp}`;
        this.enemyHpText.textContent = `${this.enemy.hp}/${this.enemy.maxHp}`;

        // Update health bar colors based on HP
        const playerPercent = this.player.getHpPercentage();
        const enemyPercent = this.enemy.getHpPercentage();

        if (playerPercent < 30) {
            this.playerHpBar.style.background = "linear-gradient(90deg, #e53e3e, #c53030)";
        } else if (playerPercent < 60) {
            this.playerHpBar.style.background = "linear-gradient(90deg, #ed8936, #dd6b20)";
        } else {
            this.playerHpBar.style.background = "linear-gradient(90deg, #48bb78, #38a169)";
        }

        if (enemyPercent < 30) {
            this.enemyHpBar.style.background = "linear-gradient(90deg, #742a2a, #63171b)";
        } else if (enemyPercent < 60) {
            this.enemyHpBar.style.background = "linear-gradient(90deg, #c53030, #9b2c2c)";
        } else {
            this.enemyHpBar.style.background = "linear-gradient(90deg, #f56565, #e53e3e)";
        }

        // Update status effects
        const playerEnemyDistance = this.hexGrid.hexDistance(
            this.player.row, this.player.col,
            this.enemy.row, this.enemy.col
        );
        const isPlayerEngaged = playerEnemyDistance === 1;

        let playerStatusText = "";
        if (this.player.isDefending) playerStatusText = "🛡️ DEFENDING";
        if (isPlayerEngaged) playerStatusText += (playerStatusText ? " | " : "") + "⚔️ ENGAGED";
        this.playerStatus.textContent = playerStatusText;

        let enemyStatusText = "";
        if (this.enemy.isDefending) enemyStatusText = "🛡️ DEFENDING";
        if (isPlayerEngaged) enemyStatusText += (enemyStatusText ? " | " : "") + "⚔️ ENGAGED";
        this.enemyStatus.textContent = enemyStatusText;

        // Update turn indicator based on phase
        if (!this.isPlayerTurn) {
            this.turnIndicator.textContent = "⏳ Enemy Turn...";
        } else if (this.currentPhase === "movement") {
            this.turnIndicator.textContent = "👣 Movement Phase";
        } else {
            this.turnIndicator.textContent = "⚔️ Combat Phase";
        }

        // Show/hide buttons based on phase
        const isCombatPhase = this.currentPhase === "combat";
        const isMovementPhase = this.currentPhase === "movement";

        this.attackBtn.style.display = isCombatPhase ? "flex" : "none";
        this.defendBtn.style.display = isCombatPhase ? "flex" : "none";
        this.specialBtn.style.display = isCombatPhase ? "flex" : "none";
        this.skipMoveBtn.style.display = isMovementPhase && this.isPlayerTurn ? "flex" : "none";

        if (isCombatPhase && this.isPlayerTurn) {
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

        // Keep only last 12 messages
        while (this.logMessages.children.length > 12) {
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
        this.removeHexClickHandlers();
        this.hexGrid.clearHighlights();

        const playerHex = this.hexGrid.getHexElement(this.player.row, this.player.col);
        const enemyHex = this.hexGrid.getHexElement(this.enemy.row, this.enemy.col);

        if (playerWon) {
            this.addLog("🎉 VICTORY! You have defeated the Dark Knight!", "system");
            if (playerHex) {
                const playerChar = playerHex.querySelector('.hexagon-character');
                if (playerChar) playerChar.classList.add('victory-animation');
            }
            if (enemyHex) {
                const enemyChar = enemyHex.querySelector('.hexagon-character');
                if (enemyChar) enemyChar.classList.add('defeat-animation');
            }
            this.turnIndicator.textContent = "🏆 Victory!";
            this.turnIndicator.style.color = "#38a169";
        } else {
            this.addLog("💀 DEFEAT! You have been defeated...", "system");
            if (playerHex) {
                const playerChar = playerHex.querySelector('.hexagon-character');
                if (playerChar) playerChar.classList.add('defeat-animation');
            }
            if (enemyHex) {
                const enemyChar = enemyHex.querySelector('.hexagon-character');
                if (enemyChar) enemyChar.classList.add('victory-animation');
            }
            this.turnIndicator.textContent = "☠️ Defeat...";
            this.turnIndicator.style.color = "#e53e3e";
        }
    }

    resetGame() {
        // Reset turn indicator style
        this.turnIndicator.style.color = "";

        // Clear log
        this.logMessages.innerHTML = "";

        // Remove hex handlers
        this.removeHexClickHandlers();

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
