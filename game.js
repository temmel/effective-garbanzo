// Character Class
class Character {
    constructor(name, hp, attack, defense, sprite) {
        this.name = name;
        this.maxHp = hp;
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.sprite = sprite;
        this.isDefending = false;
        this.row = 0;
        this.col = 0;
    }

    takeDamage(damage) {
        let actualDamage = Math.max(1, damage - this.defense);

        if (this.isDefending) {
            actualDamage = Math.floor(actualDamage * 0.5);
        }

        this.hp = Math.max(0, this.hp - actualDamage);
        this.isDefending = false;

        return actualDamage;
    }

    attackTarget(target) {
        const damage = this.attack + Math.floor(Math.random() * 6) - 2;
        return target.takeDamage(damage);
    }

    specialAttack(target) {
        const damage = Math.floor(this.attack * 1.5) + Math.floor(Math.random() * 8) - 2;
        return target.takeDamage(damage);
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

            // Offset even rows for hexagonal pattern
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
        this.player = new Character("Hero", 100, 20, 5, "🧙‍♂️");
        this.enemy = new Character("Dark Knight", 100, 18, 4, "🧟");
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.specialCooldown = 0;
        this.turnCount = 0;

        // Create hex grid (9 rows x 20 columns)
        this.hexGrid = new HexGrid(9, 20);

        // Position characters on the grid
        this.hexGrid.placeCharacter(this.player, 4, 3, true);
        this.hexGrid.placeCharacter(this.enemy, 4, 16, false);

        this.initializeUI();
        this.attachEventListeners();
        this.updateUI();
        this.addLog("⚔️ Battle begins on the hex battlefield! Your turn!", "system");
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
        this.resetBtn = document.getElementById("reset-btn");
    }

    attachEventListeners() {
        this.attackBtn.addEventListener("click", () => this.playerAction("attack"));
        this.defendBtn.addEventListener("click", () => this.playerAction("defend"));
        this.specialBtn.addEventListener("click", () => this.playerAction("special"));
        this.resetBtn.addEventListener("click", () => this.resetGame());
    }

    playerAction(action) {
        if (!this.isPlayerTurn || this.gameOver) return;

        this.turnCount++;

        switch(action) {
            case "attack":
                const damage = this.player.attackTarget(this.enemy);
                this.addLog(`🗡️ You attack for ${damage} damage!`, "player-action");
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
                const specialDamage = this.player.specialAttack(this.enemy);
                this.addLog(`✨ You unleash a SPECIAL ATTACK for ${specialDamage} damage!`, "player-action");
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

        setTimeout(() => this.enemyTurn(), 1500);
    }

    enemyTurn() {
        if (this.gameOver) return;

        // Simple AI logic
        const enemyHpPercent = this.enemy.getHpPercentage();
        const playerHpPercent = this.player.getHpPercentage();

        let action;
        const random = Math.random();

        if (enemyHpPercent < 30 && random < 0.4) {
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

        switch(action) {
            case "attack":
                const damage = this.enemy.attackTarget(this.player);
                this.addLog(`💀 Enemy attacks for ${damage} damage!`, "enemy-action");
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
                const specialDamage = this.enemy.specialAttack(this.player);
                this.addLog(`💥 Enemy uses SPECIAL ATTACK for ${specialDamage} damage!`, "enemy-action");
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
        this.enableButtons();

        if (this.specialCooldown > 0) {
            this.specialCooldown--;
        }
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
        this.playerStatus.textContent = this.player.isDefending ? "🛡️ DEFENDING" : "";
        this.enemyStatus.textContent = this.enemy.isDefending ? "🛡️ DEFENDING" : "";

        // Update turn indicator
        this.turnIndicator.textContent = this.isPlayerTurn ? "🎯 Your Turn!" : "⏳ Enemy Turn...";

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

        // Keep only last 10 messages
        while (this.logMessages.children.length > 10) {
            this.logMessages.removeChild(this.logMessages.lastChild);
        }
    }

    disableButtons() {
        this.attackBtn.disabled = true;
        this.defendBtn.disabled = true;
        this.specialBtn.disabled = true;
    }

    enableButtons() {
        this.attackBtn.disabled = false;
        this.defendBtn.disabled = false;
        this.specialBtn.disabled = this.specialCooldown > 0;
    }

    endGame(playerWon) {
        this.gameOver = true;
        this.disableButtons();

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
