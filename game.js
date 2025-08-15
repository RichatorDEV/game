// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);

// Escena del menú
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        // Cargar assets (usamos placeholders, puedes reemplazar con tus sprites)
        this.load.image('background', 'https://labs.phaser.io/assets/skies/cityscape.jpg');
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/dude.png');
        this.load.image('obstacle', 'https://labs.phaser.io/assets/sprites/block.png');
        this.load.image('bit', 'https://labs.phaser.io/assets/sprites/orb-blue.png');
        this.load.audio('bgm', 'https://labs.phaser.io/assets/audio/arcade-loop.mp3');
        this.load.audio('jump', 'https://labs.phaser.io/assets/audio/jump.wav');
        this.load.audio('hit', 'https://labs.phaser.io/assets/audio/explosion.wav');
    }

    create() {
        this.add.image(400, 300, 'background').setScale(2);
        this.add.text(400, 200, 'Pixel Dash Pro', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 300, 'Toca para empezar', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.input.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// Escena principal del juego
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Fondo en movimiento
        this.background = this.add.tileSprite(0, 0, 800, 600, 'background').setOrigin(0);

        // Suelo
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'obstacle').setScale(8, 1).refreshBody();

        // Jugador
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Bits (monedas)
        this.bits = this.physics.add.group();
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                let bit = this.bits.create(800, Phaser.Math.Between(300, 500), 'bit');
                bit.setVelocityX(-200);
            },
            loop: true
        });

        // Obstáculos
        this.obstacles = this.physics.add.group();
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                let obstacle = this.obstacles.create(800, 500, 'obstacle');
                obstacle.setVelocityX(-250);
            },
            loop: true
        });

        // Power-ups
        this.powerUps = this.physics.add.group();
        this.time.addEvent({
            delay: 5000,
            callback: () => {
                let powerUp = this.powerUps.create(800, 400, 'bit').setTint(0xff0000);
                powerUp.setVelocityX(-200);
                powerUp.type = 'shield';
            },
            loop: true
        });

        // Colisiones
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.bits, this.collectBit, null, this);
        this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // Puntuación
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Puntuación: 0', { fontSize: '32px', fill: '#fff' });

        // Sonido
        this.bgm = this.sound.add('bgm', { loop: true });
        this.bgm.play();
        this.jumpSound = this.sound.add('jump');
        this.hitSound = this.sound.add('hit');

        // Controles táctiles
        this.input.on('pointerdown', () => {
            if (this.player.body.touching.down) {
                this.player.setVelocityY(-400);
                this.jumpSound.play();
            }
        });
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        // Mover fondo
        this.background.tilePositionX += 2;

        // Controles teclado (para pruebas en PC)
        if (this.cursors.down.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(100);
        }

        // Limpiar objetos fuera de pantalla
        this.bits.getChildren().forEach(bit => {
            if (bit.x < -50) bit.destroy();
        });
        this.obstacles.getChildren().forEach(obstacle => {
            if (obstacle.x < -50) obstacle.destroy();
        });
        this.powerUps.getChildren().forEach(powerUp => {
            if (powerUp.x < -50) powerUp.destroy();
        });

        // Actualizar puntuación
        this.score += 1;
        this.scoreText.setText('Puntuación: ' + this.score);
    }

    collectBit(player, bit) {
        bit.destroy();
        this.score += 10;
    }

    collectPowerUp(player, powerUp) {
        powerUp.destroy();
        if (powerUp.type === 'shield') {
            player.setTint(0x00ff00);
            this.time.delayedCall(5000, () => player.clearTint());
        }
    }

    hitObstacle(player, obstacle) {
        if (player.tint === 0x00ff00) return; // Escudo activo
        this.bgm.stop();
        this.hitSound.play();
        this.scene.start('GameOverScene', { score: this.score });
    }
}

// Escena de Game Over
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.add.image(400, 300, 'background').setScale(2);
        this.add.text(400, 200, 'Game Over', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
        this.add.text(400, 300, 'Puntuación: ' + this.score, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 400, 'Toca para reiniciar', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.input.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
