import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRankedLeaderboard,
  computeZoneProgress,
  detectMilestone,
} from './carnivalApi';

test('computeZoneProgress counts stamps accurately across all 5 exhibition zones', () => {
  const progress = computeZoneProgress(new Set(['W1', 'W2', 'M5']));
  const wZone = progress.find((p) => p.zone === 'W');
  const mZone = progress.find((p) => p.zone === 'M');
  assert.ok(wZone);
  assert.ok(mZone);
  assert.equal(wZone.stamped, 2);
  assert.equal(wZone.total, 2);
  assert.equal(wZone.completed, true);
  assert.equal(mZone.stamped, 1);
  assert.equal(mZone.total, 15);
  assert.equal(mZone.completed, false);
});

test('detectMilestone recognizes first stamp and full zone clear', () => {
  const firstMsg = detectMilestone(new Set(), new Set(['M5']), 'M5');
  assert.ok(firstMsg && firstMsg.includes('首次打卡'));

  const zoneMsg = detectMilestone(new Set(['W1']), new Set(['W1', 'W2']), 'W2');
  assert.ok(zoneMsg && zoneMsg.includes('Workshop 工坊'));

  const regularMsg = detectMilestone(new Set(['M5', 'M6']), new Set(['M5', 'M6', 'M7']), 'M7');
  assert.equal(regularMsg, null);
});

test('buildRankedLeaderboard sorts by stampedCount desc and tie-breaks by earlier timestamp', () => {
  const seed = [
    { userId: 'u1', nickname: 'Alpha', avatar: '🚀', stampedCount: 5, lastStampedAt: 2000, completedZones: [] },
    { userId: 'u2', nickname: 'Beta', avatar: '🤖', stampedCount: 2, lastStampedAt: 1000, completedZones: [] },
  ];
  const me = { userId: 'me', nickname: '我', avatar: '⚡' };

  const r0 = buildRankedLeaderboard(seed, me, new Set(), 3000);
  assert.equal(r0.myRank, 3);

  const r1 = buildRankedLeaderboard(seed, me, new Set(['M5', 'M6']), 500);
  assert.equal(r1.myRank, 2);
  assert.equal(r1.entries[1].isMe, true);

  const r2 = buildRankedLeaderboard(
    seed,
    me,
    new Set(['M1', 'M2', 'M3', 'M4', 'M5', 'M6']),
    4000
  );
  assert.equal(r2.myRank, 1);
  assert.equal(r2.entries[0].userId, 'me');
});
