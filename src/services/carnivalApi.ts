import { BOOTHS, ZONES, type ZoneKey } from '../data/carnivalData';

export interface VisitorProfile {
  userId: string;
  nickname: string;
  avatar: string;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  avatar: string;
  stampedCount: number;
  lastStampedAt: number;
  completedZones: ZoneKey[];
  rank: number;
  isMe?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  myRank: number;
  totalExplorers: number;
  source: 'remote' | 'local';
}

export interface CheckInPayload {
  userId: string;
  nickname: string;
  avatar: string;
  boothId: string;
  scannedAt: number;
}

export interface CheckInResponse {
  ok: boolean;
  boothId: string;
  stampedCount: number;
  newRank: number;
  previousRank: number;
  rankDelta: number;
  source: 'remote' | 'local';
}

export interface ZoneProgress {
  zone: Exclude<ZoneKey, 'L'>;
  name: string;
  color: string;
  stamped: number;
  total: number;
  completed: boolean;
}

const PROFILE_KEY = 'yizhuang_carnival_profile_v1';
const LAST_STAMP_TS_KEY = 'yizhuang_carnival_last_ts_v1';

const AVATAR_POOL = ['🤖', '🦾', '🚀', '⚡', '🛸', '🦊', '👾', '🧩'];

/**
 * Seed explorers used when no external backend (VITE_API_BASE_URL) is configured.
 * Once a custom backend is connected, GET /api/leaderboard replaces this list seamlessly.
 */
const DEMO_EXPLORERS: Array<Omit<LeaderboardEntry, 'rank'>> = [
  {
    userId: 'demo-01',
    nickname: '探月极客小宇',
    avatar: '🚀',
    stampedCount: 38,
    lastStampedAt: 1763700100000,
    completedZones: ['Q', 'W', 'S'],
  },
  {
    userId: 'demo-02',
    nickname: '亦庄机械臂狂魔',
    avatar: '🦾',
    stampedCount: 31,
    lastStampedAt: 1763701200000,
    completedZones: ['Q', 'W'],
  },
  {
    userId: 'demo-03',
    nickname: '清华具身派',
    avatar: '🤖',
    stampedCount: 24,
    lastStampedAt: 1763702400000,
    completedZones: ['G', 'W'],
  },
  {
    userId: 'demo-04',
    nickname: '大头机器狗驯兽师',
    avatar: '⚡',
    stampedCount: 16,
    lastStampedAt: 1763703300000,
    completedZones: ['W'],
  },
  {
    userId: 'demo-05',
    nickname: '拼豆像素艺术家',
    avatar: '🧩',
    stampedCount: 9,
    lastStampedAt: 1763704100000,
    completedZones: ['Q'],
  },
  {
    userId: 'demo-06',
    nickname: '小鸭子头号粉丝',
    avatar: '👾',
    stampedCount: 4,
    lastStampedAt: 1763705200000,
    completedZones: [],
  },
  {
    userId: 'demo-07',
    nickname: '咖啡机器人品鉴官',
    avatar: '🦊',
    stampedCount: 2,
    lastStampedAt: 1763706000000,
    completedZones: [],
  },
  {
    userId: 'demo-08',
    nickname: '初探机域萌新',
    avatar: '🛸',
    stampedCount: 1,
    lastStampedAt: 1763706900000,
    completedZones: [],
  },
];

const TRACKED_ZONES: Array<Exclude<ZoneKey, 'L'>> = ['Q', 'M', 'S', 'G', 'W'];

export function computeZoneProgress(stampedIds: Set<string>): ZoneProgress[] {
  return TRACKED_ZONES.map((z) => {
    const inZone = BOOTHS.filter((b) => b.z === z);
    const count = inZone.filter((b) => stampedIds.has(b.id)).length;
    return {
      zone: z,
      name: ZONES[z].name,
      color: ZONES[z].color,
      stamped: count,
      total: inZone.length,
      completed: inZone.length > 0 && count === inZone.length,
    };
  });
}

export function detectMilestone(
  prevStamped: Set<string>,
  nextStamped: Set<string>,
  justStampedId: string
): string | null {
  const prevCount = BOOTHS.filter((b) => prevStamped.has(b.id)).length;
  const nextCount = BOOTHS.filter((b) => nextStamped.has(b.id)).length;

  if (nextCount === 45 && prevCount < 45) {
    return '🏆 终极通关！45 个机器人展位全制霸！';
  }

  const booth = BOOTHS.find((b) => b.id === justStampedId);
  if (booth && booth.z !== 'L') {
    const zoneBooths = BOOTHS.filter((b) => b.z === booth.z);
    const wasDone = zoneBooths.every((b) => prevStamped.has(b.id));
    const isDone = zoneBooths.every((b) => nextStamped.has(b.id));
    if (!wasDone && isDone) {
      return `✨ 制霸「${ZONES[booth.z].name}」全部展位！`;
    }
  }

  if (prevCount < 1 && nextCount === 1) {
    return '🎯 解锁成就：初入机域 · 完成首次打卡！';
  }
  if (prevCount < 5 && nextCount >= 5) {
    return '🔥 达成里程碑：逛展达人（5/45）！';
  }
  if (prevCount < 15 && nextCount >= 15) {
    return '⚡ 达成里程碑：具身探索先锋（15/45）！';
  }

  return null;
}

export function buildRankedLeaderboard(
  rawEntries: Array<Omit<LeaderboardEntry, 'rank'>>,
  me: VisitorProfile,
  myStampedIds: Set<string>,
  myLastStampedAt: number
): { entries: LeaderboardEntry[]; myRank: number } {
  const myZoneProgress = computeZoneProgress(myStampedIds);
  const myCompletedZones = myZoneProgress.filter((z) => z.completed).map((z) => z.zone);
  const myCount = BOOTHS.filter((b) => myStampedIds.has(b.id)).length;

  const filtered = rawEntries.filter((e) => e.userId !== me.userId);
  const combined: Array<Omit<LeaderboardEntry, 'rank'>> = [
    ...filtered,
    {
      userId: me.userId,
      nickname: me.nickname,
      avatar: me.avatar,
      stampedCount: myCount,
      lastStampedAt: myLastStampedAt,
      completedZones: myCompletedZones,
      isMe: true,
    },
  ];

  // Higher stampedCount first; tie-breaker: earlier completion timestamp wins
  combined.sort((a, b) => {
    if (b.stampedCount !== a.stampedCount) return b.stampedCount - a.stampedCount;
    return a.lastStampedAt - b.lastStampedAt;
  });

  const ranked: LeaderboardEntry[] = combined.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const myRow = ranked.find((r) => r.userId === me.userId);
  return {
    entries: ranked,
    myRank: myRow ? myRow.rank : ranked.length,
  };
}

export function loadOrCreateVisitorProfile(): VisitorProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VisitorProfile>;
      if (parsed.userId && parsed.nickname) {
        return {
          userId: parsed.userId,
          nickname: parsed.nickname,
          avatar: parsed.avatar || '🤖',
        };
      }
    }
  } catch {
    // Ignore storage read error
  }

  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  const profile: VisitorProfile = {
    userId: `visitor-${Date.now().toString(36)}-${suffix}`,
    nickname: `机域探索官 #${suffix}`,
    avatar: AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)],
  };
  saveVisitorProfile(profile);
  return profile;
}

export function saveVisitorProfile(profile: VisitorProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage write error
  }
}

export function getLastStampTimestamp(): number {
  try {
    const v = Number(localStorage.getItem(LAST_STAMP_TS_KEY));
    if (Number.isFinite(v) && v > 0) return v;
  } catch {
    // Ignore
  }
  return Date.now();
}

export function setLastStampTimestamp(ts: number): void {
  try {
    localStorage.setItem(LAST_STAMP_TS_KEY, String(ts));
  } catch {
    // Ignore
  }
}

function getApiBaseUrl(): string {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return (metaEnv?.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

/**
 * Plug-and-play backend adapter.
 * - When VITE_API_BASE_URL is configured, syncs check-ins & leaderboard with your server:
 *     POST {BASE}/api/checkins
 *     GET  {BASE}/api/leaderboard?userId=...
 *     PUT  {BASE}/api/profile
 * - When empty or unreachable, falls back seamlessly to local demo ranking + localStorage.
 */
export const carnivalApi = {
  isRemoteConfigured(): boolean {
    return Boolean(getApiBaseUrl());
  },

  async fetchLeaderboard(
    me: VisitorProfile,
    myStampedIds: Set<string>
  ): Promise<LeaderboardResponse> {
    const base = getApiBaseUrl();
    if (base) {
      try {
        const res = await fetch(
          `${base}/api/leaderboard?userId=${encodeURIComponent(me.userId)}`,
          { headers: { Accept: 'application/json' } }
        );
        if (res.ok) {
          const data = (await res.json()) as {
            entries: LeaderboardEntry[];
            myRank: number;
            totalExplorers?: number;
          };
          return {
            entries: data.entries.map((e) => ({ ...e, isMe: e.userId === me.userId })),
            myRank: data.myRank,
            totalExplorers: data.totalExplorers ?? data.entries.length,
            source: 'remote',
          };
        }
      } catch {
        // Fall through to local fallback
      }
    }

    const { entries, myRank } = buildRankedLeaderboard(
      DEMO_EXPLORERS,
      me,
      myStampedIds,
      getLastStampTimestamp()
    );
    return {
      entries,
      myRank,
      totalExplorers: entries.length,
      source: 'local',
    };
  },

  async submitCheckIn(
    payload: CheckInPayload,
    prevStampedIds: Set<string>,
    nextStampedIds: Set<string>
  ): Promise<CheckInResponse> {
    const prevRank = buildRankedLeaderboard(
      DEMO_EXPLORERS,
      { userId: payload.userId, nickname: payload.nickname, avatar: payload.avatar },
      prevStampedIds,
      getLastStampTimestamp()
    ).myRank;

    setLastStampTimestamp(payload.scannedAt);

    const base = getApiBaseUrl();
    if (base) {
      try {
        const res = await fetch(`${base}/api/checkins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as Partial<CheckInResponse>;
          const newRank = data.newRank ?? prevRank;
          return {
            ok: true,
            boothId: payload.boothId,
            stampedCount: data.stampedCount ?? nextStampedIds.size,
            newRank,
            previousRank: data.previousRank ?? prevRank,
            rankDelta: (data.previousRank ?? prevRank) - newRank,
            source: 'remote',
          };
        }
      } catch {
        // Fall through to local ranking computation
      }
    }

    const nextRank = buildRankedLeaderboard(
      DEMO_EXPLORERS,
      { userId: payload.userId, nickname: payload.nickname, avatar: payload.avatar },
      nextStampedIds,
      payload.scannedAt
    ).myRank;

    return {
      ok: true,
      boothId: payload.boothId,
      stampedCount: BOOTHS.filter((b) => nextStampedIds.has(b.id)).length,
      newRank: nextRank,
      previousRank: prevRank,
      rankDelta: prevRank - nextRank,
      source: 'local',
    };
  },

  async syncProfile(profile: VisitorProfile): Promise<void> {
    saveVisitorProfile(profile);
    const base = getApiBaseUrl();
    if (!base) return;
    try {
      await fetch(`${base}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch {
      // Ignore offline profile sync error
    }
  },
};
