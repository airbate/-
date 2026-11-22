import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOTHS, SPOTS, SPOT_BY_ID } from '../data/carnivalData';
import {
  cameraForPoint,
  clampCamera,
  filterDirectoryBooths,
  findNextDpadBooth,
  parseBoothQRCode,
  stepBooth,
} from './mapLogic';

test('carnival dataset contains 45 booths and 3 landmarks', () => {
  assert.equal(BOOTHS.length, 45);
  assert.equal(SPOTS.length, 48);
  assert.equal(SPOT_BY_ID['M5'].name, '拼豆机器人');
});

test('parseBoothQRCode handles URL params, raw IDs, prefixed codes, and rejects invalid/landmark IDs', () => {
  assert.equal(parseBoothQRCode('https://example.com/?stamp=M5'), 'M5');
  assert.equal(parseBoothQRCode('https://yizhuang.cn/guide?stamp=q3&from=wx'), 'Q3');
  assert.equal(parseBoothQRCode('S10'), 'S10');
  assert.equal(parseBoothQRCode('booth_G12'), 'G12');
  assert.equal(parseBoothQRCode('YZ-W2-2026'), 'W2');
  assert.equal(parseBoothQRCode('STAGE'), null);
  assert.equal(parseBoothQRCode('M99'), null);
  assert.equal(parseBoothQRCode('random text'), null);
  assert.equal(parseBoothQRCode(''), null);
});

test('clampCamera resets pan at scale <= 1 and bounds pan when zoomed in', () => {
  assert.deepEqual(clampCamera({ scale: 1, tx: 120, ty: -80 }), { scale: 1, tx: 0, ty: 0 });
  assert.deepEqual(clampCamera({ scale: 0.7, tx: 50, ty: 50 }), { scale: 1, tx: 0, ty: 0 });
  const clamped = clampCamera({ scale: 2, tx: 9999, ty: -9999 });
  assert.equal(clamped.scale, 2);
  assert.equal(clamped.tx, 460);
  assert.equal(clamped.ty, -580);
});

test('cameraForPoint centers target booth coordinates at specified zoom', () => {
  const m5 = SPOT_BY_ID['M5'];
  const cam = cameraForPoint(m5.cx, m5.cy, 2);
  assert.equal(cam.scale, 2);
  assert.equal(cam.tx, (400 - m5.cx) * 2);
  assert.equal(cam.ty, (520 - m5.cy) * 2);
});

test('findNextDpadBooth navigates spatially in all four directions from M5', () => {
  const m5 = SPOT_BY_ID['M5'];
  assert.equal(findNextDpadBooth(m5, 'left')?.id, 'M4');
  assert.equal(findNextDpadBooth(m5, 'right')?.id, 'M6');
  assert.equal(findNextDpadBooth(m5, 'up')?.id, 'M9');
  assert.equal(findNextDpadBooth(m5, 'down')?.id, 'W1');
});

test('filterDirectoryBooths filters by zone and Chinese/ID query', () => {
  assert.equal(filterDirectoryBooths('ALL', '').length, 45);
  assert.equal(filterDirectoryBooths('Q', '').length, 6);
  assert.equal(filterDirectoryBooths('M', '拼豆').map((b) => b.id).join(','), 'M5');
  assert.equal(filterDirectoryBooths('G', '清华').map((b) => b.id).join(','), 'G1');
});

test('stepBooth wraps cleanly across the 45 booths', () => {
  assert.equal(stepBooth(BOOTHS[0].id, -1).id, BOOTHS[BOOTHS.length - 1].id);
  assert.equal(stepBooth(BOOTHS[BOOTHS.length - 1].id, 1).id, BOOTHS[0].id);
});
