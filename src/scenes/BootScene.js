import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  HOLE_WIDTH,
  HOLE_HEIGHT,
  MOLE_WIDTH,
  MOLE_HEIGHT,
  ROUND_SECONDS,
  SCENE_BOOT,
  SCENE_GAME,
  DEPTH_TEXT,
} from '../game/constants.js';
import {
  createOverlayDimmer,
  createBlinkingPrompt,
  wireConfirmControls,
} from './overlay.js';

const FLAG_COLORS = [0xff5f6d, 0xffc371, 0x8093f1, 0x7ee8fa, 0xb4ffd2];

/**
 * Generates all textures procedurally so the game ships with no binary
 * assets, then hands over to the game scene.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_BOOT);
  }

  create() {
    this.createBackgroundTexture();
    this.createHoleTexture();
    this.createMoleTexture();
    this.createStartScreen();
  }

  /**
   * Visible start screen shown before the first round begins, so
   * sighted players see the rules, scoring, and both control schemes
   * instead of only the sr-only description in index.html. The dimmer,
   * blinking prompt, and the pointer/keyboard confirm wiring come from
   * the shared overlay scaffolding in ./overlay.js.
   */
  createStartScreen() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background');
    createOverlayDimmer(this, 0.45);

    this.add
      .text(GAME_WIDTH / 2, 130, 'Whack-a-mole', {
        fontFamily: 'Arial',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH_TEXT);

    const body = { fontFamily: 'Arial', fontSize: '26px', color: '#ffffff' };
    const lines = [
      'Moles pop out of the holes — whack them before they hide!',
      'Click or tap a mole to whack it.',
      'Arrow keys move the selection · Enter or Space whacks.',
      `Each mole scores one point · ${ROUND_SECONDS}-second round.`,
    ];
    lines.forEach((line, index) => {
      this.add
        .text(GAME_WIDTH / 2, 225 + index * 44, line, body)
        .setOrigin(0.5)
        .setDepth(DEPTH_TEXT);
    });

    const prompt = this.add
      .text(GAME_WIDTH / 2, 480, 'Click, tap, or press Enter or Space to start', {
        ...body,
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH_TEXT);
    createBlinkingPrompt(this, prompt);

    wireConfirmControls(this, () => this.scene.start(SCENE_GAME));
  }

  createBackgroundTexture() {
    const g = this.make.graphics({ add: false });

    // Sky and grass.
    g.fillStyle(0x9adcf0);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x7ec850);
    g.fillRect(0, 120, GAME_WIDTH, GAME_HEIGHT - 120);

    // Alternating turf stripes for a playful carnival look.
    g.fillStyle(0x74bd49);
    for (let x = 0; x < GAME_WIDTH; x += 80) {
      g.fillRect(x, 120, 40, GAME_HEIGHT - 120);
    }

    // Bunting flags strung along the top.
    g.fillStyle(0x4a3620);
    g.fillRect(0, 22, GAME_WIDTH, 8);
    for (let i = 0; i < GAME_WIDTH / 40; i++) {
      const left = i * 40;
      g.fillStyle(FLAG_COLORS[i % FLAG_COLORS.length]);
      g.fillTriangle(left, 30, left + 40, 30, left + 20, 66);
    }

    g.generateTexture('background', GAME_WIDTH, GAME_HEIGHT);
    g.destroy();
  }

  createHoleTexture() {
    // The hole is generated in two halves so the game scene can sandwich
    // the mole between them: the back half renders behind the mole and the
    // front half (with the hole's front lip) renders above it. This works
    // with both the WebGL and Canvas renderers, unlike geometry masks.
    const back = this.make.graphics({ add: false });
    this.drawHole(back, 0);
    back.generateTexture('hole-back', HOLE_WIDTH, HOLE_HEIGHT / 2);
    back.destroy();

    const front = this.make.graphics({ add: false });
    this.drawHole(front, -HOLE_HEIGHT / 2);
    front.generateTexture('hole-front', HOLE_WIDTH, HOLE_HEIGHT / 2);
    front.destroy();
  }

  drawHole(g, offsetY) {
    const cx = HOLE_WIDTH / 2;
    const cy = HOLE_HEIGHT / 2 + offsetY;
    g.fillStyle(0x3b2a1a);
    g.fillEllipse(cx, cy, HOLE_WIDTH, HOLE_HEIGHT);
    g.lineStyle(8, 0x6b4a2a);
    g.strokeEllipse(cx, cy, HOLE_WIDTH, HOLE_HEIGHT);
  }

  createMoleTexture() {
    const g = this.make.graphics({ add: false });
    this.drawFedora(g);
    g.generateTexture('mole', MOLE_WIDTH, MOLE_HEIGHT);
    g.destroy();
  }

  drawFedora(g) {
    const cx = MOLE_WIDTH / 2;

    // Crown - Red Hat Red (0xee0000).
    // The crown tapers gently from the hatband up to the creased top.
    g.fillStyle(0xee0000);
    g.beginPath();
    g.moveTo(cx - 33, 72);
    g.lineTo(cx - 29, 44);
    g.lineTo(cx - 24, 28);
    g.lineTo(cx - 14, 24);
    g.lineTo(cx, 26);
    g.lineTo(cx + 14, 24);
    g.lineTo(cx + 24, 28);
    g.lineTo(cx + 29, 44);
    g.lineTo(cx + 33, 72);
    g.closePath();
    g.fillPath();

    // Smooth dome across the top of the crown.
    g.fillEllipse(cx, 26, 48, 10);

    // Fedora center crease fold (subtle indentation shadow).
    g.fillStyle(0xb30000);
    g.beginPath();
    g.moveTo(cx - 5, 25);
    g.lineTo(cx + 5, 25);
    g.lineTo(cx + 2, 45);
    g.lineTo(cx, 48);
    g.lineTo(cx - 2, 45);
    g.closePath();
    g.fillPath();

    // Side pinch accent lines.
    g.lineStyle(2, 0xc00000, 0.6);
    g.lineBetween(cx - 21, 32, cx - 18, 46);
    g.lineBetween(cx + 21, 32, cx + 18, 46);

    // Soft highlight across the top crown rim.
    g.fillStyle(0xff4d4d);
    g.fillEllipse(cx - 14, 24, 18, 3);
    g.fillEllipse(cx + 14, 24, 14, 3);

    // Hatband (black ribbon around the base of the crown).
    g.fillStyle(0x141414);
    g.beginPath();
    g.moveTo(cx - 32, 60);
    g.lineTo(cx + 32, 60);
    g.lineTo(cx + 34, 73);
    g.lineTo(cx - 34, 73);
    g.closePath();
    g.fillPath();

    // Ribbon specular highlight.
    g.fillStyle(0x383838);
    g.fillRect(cx - 32, 65, 64, 2);

    // Ribbon bow / knot fold on the side.
    g.fillStyle(0x242424);
    g.fillRoundedRect(cx - 26, 58, 8, 17, 2);
    g.fillStyle(0x444444);
    g.fillRect(cx - 25, 59, 2, 15);
    g.fillStyle(0x141414);
    g.fillCircle(cx - 22, 66, 2);

    // Fedora Brim.
    // Under-brim shadow for depth against the hole opening.
    g.fillStyle(0x750000);
    g.fillEllipse(cx, 83, 92, 18);

    // Main upper brim in Red Hat Red.
    g.fillStyle(0xee0000);
    g.fillEllipse(cx, 80, 92, 18);

    // Upper brim highlight curve.
    g.fillStyle(0xff3333);
    g.fillEllipse(cx, 78, 82, 6);
    g.fillStyle(0xee0000);
    g.fillEllipse(cx, 79, 84, 8);
  }
}
