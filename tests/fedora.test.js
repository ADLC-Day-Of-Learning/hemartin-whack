import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Scene: class {
      constructor(key) {
        this.key = key;
      }
    },
  },
}));

import BootScene from '../src/scenes/BootScene.js';
import { MOLE_WIDTH, MOLE_HEIGHT } from '../src/game/constants.js';
import { whackOutcome, pointerWhackOutcome } from '../src/game/whack.js';

function createMockGraphics() {
  const operations = [];
  const fills = [];
  const lines = [];

  return {
    operations,
    fills,
    lines,
    fillStyle(color, alpha = 1) {
      fills.push({ color, alpha });
      operations.push({ op: 'fillStyle', color, alpha });
    },
    lineStyle(width, color, alpha = 1) {
      lines.push({ width, color, alpha });
      operations.push({ op: 'lineStyle', width, color, alpha });
    },
    beginPath() {
      operations.push({ op: 'beginPath' });
    },
    moveTo(x, y) {
      operations.push({ op: 'moveTo', x, y });
    },
    lineTo(x, y) {
      operations.push({ op: 'lineTo', x, y });
    },
    closePath() {
      operations.push({ op: 'closePath' });
    },
    fillPath() {
      operations.push({ op: 'fillPath' });
    },
    fillEllipse(cx, cy, width, height) {
      operations.push({ op: 'fillEllipse', cx, cy, width, height });
    },
    fillRect(x, y, width, height) {
      operations.push({ op: 'fillRect', x, y, width, height });
    },
    fillRoundedRect(x, y, width, height, radius) {
      operations.push({ op: 'fillRoundedRect', x, y, width, height, radius });
    },
    fillCircle(cx, cy, radius) {
      operations.push({ op: 'fillCircle', cx, cy, radius });
    },
    lineBetween(x1, y1, x2, y2) {
      operations.push({ op: 'lineBetween', x1, y1, x2, y2 });
    },
  };
}

describe('Red Hat fedora target graphics', () => {
  it('defines drawFedora on BootScene', () => {
    const scene = new BootScene();
    expect(typeof scene.drawFedora).toBe('function');
  });

  it('draws the fedora using the Red Hat corporate palette', () => {
    const scene = new BootScene();
    const g = createMockGraphics();
    scene.drawFedora(g);

    const filledColors = g.fills.map((f) => f.color);
    // Red Hat official red
    expect(filledColors).toContain(0xee0000);
    // Black hatband / ribbon
    expect(filledColors).toContain(0x141414);
  });

  it('draws within the bounds of MOLE_WIDTH and MOLE_HEIGHT', () => {
    const scene = new BootScene();
    const g = createMockGraphics();
    scene.drawFedora(g);

    for (const op of g.operations) {
      if (op.op === 'moveTo' || op.op === 'lineTo') {
        expect(op.x).toBeGreaterThanOrEqual(0);
        expect(op.x).toBeLessThanOrEqual(MOLE_WIDTH);
        expect(op.y).toBeGreaterThanOrEqual(0);
        expect(op.y).toBeLessThanOrEqual(MOLE_HEIGHT);
      } else if (op.op === 'fillEllipse') {
        expect(op.cx - op.width / 2).toBeGreaterThanOrEqual(0);
        expect(op.cx + op.width / 2).toBeLessThanOrEqual(MOLE_WIDTH);
        expect(op.cy - op.height / 2).toBeGreaterThanOrEqual(0);
        expect(op.cy + op.height / 2).toBeLessThanOrEqual(MOLE_HEIGHT);
      } else if (op.op === 'fillRect' || op.op === 'fillRoundedRect') {
        expect(op.x).toBeGreaterThanOrEqual(0);
        expect(op.x + op.width).toBeLessThanOrEqual(MOLE_WIDTH);
        expect(op.y).toBeGreaterThanOrEqual(0);
        expect(op.y + op.height).toBeLessThanOrEqual(MOLE_HEIGHT);
      } else if (op.op === 'lineBetween') {
        expect(op.x1).toBeGreaterThanOrEqual(0);
        expect(op.x1).toBeLessThanOrEqual(MOLE_WIDTH);
        expect(op.x2).toBeGreaterThanOrEqual(0);
        expect(op.x2).toBeLessThanOrEqual(MOLE_WIDTH);
        expect(op.y1).toBeGreaterThanOrEqual(0);
        expect(op.y1).toBeLessThanOrEqual(MOLE_HEIGHT);
        expect(op.y2).toBeGreaterThanOrEqual(0);
        expect(op.y2).toBeLessThanOrEqual(MOLE_HEIGHT);
      }
    }
  });

  it('draws the crown, hatband, and wide brim', () => {
    const scene = new BootScene();
    const g = createMockGraphics();
    scene.drawFedora(g);

    // Crown has path commands (polygon)
    const pathOps = g.operations.filter(
      (op) => op.op === 'moveTo' || op.op === 'lineTo',
    );
    expect(pathOps.length).toBeGreaterThan(0);

    // Brim includes an ellipse spanning almost full MOLE_WIDTH
    const brimEllipse = g.operations.find(
      (op) => op.op === 'fillEllipse' && op.width >= 90,
    );
    expect(brimEllipse).toBeDefined();

    // Hatband ribbon includes rect or rounded rect
    const ribbonOp = g.operations.find(
      (op) => op.op === 'fillRect' || op.op === 'fillRoundedRect',
    );
    expect(ribbonOp).toBeDefined();
  });

  it('preserves emergence and hit detection with the fedora target', () => {
    const holeY = 200;
    const emergedMoleY = holeY + 22; // fully up

    // Keyboard hit on emerged target
    expect(
      whackOutcome({
        roundOver: false,
        busy: true,
        whacked: false,
        moleY: emergedMoleY,
        holeY,
      }),
    ).toBe('hit');

    // Pointer hit on emerged fedora crown
    expect(
      pointerWhackOutcome({
        roundOver: false,
        busy: true,
        whacked: false,
        moleY: emergedMoleY,
        holeY,
        localX: MOLE_WIDTH / 2,
        localY: 30, // on the fedora crown
      }),
    ).toBe('hit');
  });
});
