import { http } from '@tauri-apps/api';
import { Store } from 'tauri-plugin-store-api';

const baseurl = 'https://api.faceit.com/';
export interface FaceitUser {
  result: string;
  payload: Payload;
}

export interface Payload {
  id: string;
  activated_at: Date;
  active_team_id: string;
  avatar: string;
  country: string;
  created_at: Date;
  flag: string;
  friends: string[];
  games: Games;
  gender: string;
  guest_info: GuestInfo;
  matching_sound: string;
  memberships: string[];
  nickname: string;
  phone_verified: boolean;
  registration_status: string;
  status: string;
  tags: string[];
  timezone: string;
  updated_by: string;
  user_type: string;
  version: number;
  platforms: Platforms;
}

export interface Games {
  battalion: Game;
  csgo: Game;
}

export interface Game {
  game_id: string;
  game_name: string;
  faceit_elo: number;
  region: string;
  region_updated_at: Date;
  skill_level: number;
  skill_level_label: string;
  elo_refreshed_by_user_at: Date;
}

export interface GuestInfo {}

export interface Platforms {
  steam: Steam;
}

export interface Steam {
  id: string;
  nickname: string;
  id64: string;
}

export interface GameSpecificDetails {
  lifetime: Lifetime;
  segments: SegmentElement[];
}

export interface Lifetime {
  _id: LifetimeID;
  pendingStats: any[];
  rev: number;
  m1: string;
  m2: string;
  m7: string;
  m13: string;
  k5: string;
  k6: string;
  k8: string;
  s0: string[];
  s1: string;
  s2: string;
  s3: string;
  s4: string;
  s5: string;
  s6: string;
  s7: string;
  updated_at: number;
}

export interface LifetimeID {
  game: string;
  playerId: string;
}

export interface SegmentElement {
  segments: { [key: string]: SegmentValue };
  _id: SegmentID;
}

export interface SegmentID {
  game: string;
  gameMode: string;
  segmentId: string;
  playerId: string;
}

export interface SegmentValue {
  m11: string;
  m10: string;
  m13: string;
  m12: string;
  m14: string;
  m5: string;
  m1: string;
  k11: string;
  k10: string;
  m4: string;
  k2: string;
  m3: string;
  k1: string;
  k3: string;
  m7: string;
  m6: string;
  m2: string;
  k6: string;
  k5: string;
  k4: string;
  m9: string;
  k7: string;
  k9: string;
  k8: string;
  m8: string;
  k12: string;
}
export interface Match {
  _id: ID;
  created_at?: number;
  updated_at?: number;
  i9: string;
  nickname: string;
  i10: string;
  i13: string;
  i15: string;
  i6: string;
  i14: string;
  i7: string;
  i16: string;
  i8: string;
  playerId: string;
  c3: string;
  c2: string;
  c4: string;
  c1: string;
  i19?: string;
  teamId: string;
  i3: string;
  i4: string;
  i5: string;
  premade?: boolean;
  c5: C5;
  bestOf?: string;
  competitionId?: string;
  date: number;
  game: Game;
  gameMode: GameMode;
  i0: I0;
  i1: string; //MAP
  i12: string;
  i18: string;
  i2: string;
  matchId: string;
  matchRound?: string;
  played?: string;
  status: Status;
  elo?: C5;
  updated_match_type?: boolean;
}

export type ParsedMatch = {
  matchId: string;
  map: string; //map
  elo: number;
  eloChange: number;
  date: number;
  HSpercent: number; //HSpercent
  KRratio: number; //KRratio
  KDratio: number; //KDratio
  created_at: number; //
  nickname: string; //
  teamId: string;
  winning_team: string; //winning-team id
};

export interface ID {
  matchId: string;
  playerId: string;
}

export type C5 = number | string;

export enum GameMode {
  The5V5 = '5v5',
}

export enum I0 {
  Eu = 'EU',
}

export type Self = {
  name: string;
  id: string;
  friendIds: string[];
};

export type MatchAndTeam = {
  matchId: string;
  teamId: string;
};

export enum Maps {
  DeCache = 'de_cache',
  DeCbble = 'de_cbble',
  DeDust2 = 'de_dust2',
  DeInferno = 'de_inferno',
  DeMirage = 'de_mirage',
  DeNuke = 'de_nuke',
  DeOverpass = 'de_overpass',
  DeSeason = 'de_season',
  DeTrain = 'de_train',
}

export enum Status {
  Applied = 'APPLIED',
  Pending = 'PENDING',
}

type MatchHistory = {
  amount: number;
  parsedMatches: ParsedMatch[];
};

export type Gamer = {
  id: string;
  nickname: string;
  last_sync: number;
  history: MatchHistory;
};

const user_store = new Store('.userdata.dat');
const self_store = new Store('.s.dat');

export const GetSelf = async () => {
  const self = await self_store.get<Self>('self');
  if (self) await UpdateGamer(self.id);
  return self;
};

export const UpdateGamer = async (id: string) => {
  const gamer = await user_store.get<Gamer>(id);
  if (gamer) {
    if (
      gamer.last_sync < Date.now() - 1000 * 60 * 10 ||
      gamer.nickname.trim().length === 0
    ) {
      const latestGame = await FetchMatches(id, 0, 1);
      if (latestGame) {
        gamer.nickname = latestGame[0].nickname;
        const payload = await GetFaceitIdByName(gamer.nickname);
        if (payload) {
          const details = await GetGameSpecificDetails(id);
          if (details) {
            if (details.data.lifetime.rev > gamer?.history?.amount ?? 0) {
              const matches = await GetPlayerMatches(
                id,
                details.data.lifetime.rev,
                gamer?.history?.parsedMatches ?? [],
                gamer?.history?.amount ?? 0
              );
              gamer.history.amount = details.data.lifetime.rev;
              gamer.history.parsedMatches = matches;
            }
          }
        }
      }
      gamer.last_sync = Date.now();

      await user_store.set(id, gamer);
    }
    return;
  }

  if (gamer === null) {
    const latestGame = await FetchMatches(id, 0, 1);
    if (latestGame && latestGame.length > 0) {
      const payload = await GetFaceitIdByName(latestGame[0]?.nickname);
      if (payload && payload.id) {
        const details = await GetGameSpecificDetails(payload.id);
        const matches = await GetPlayerMatches(
          payload.id,
          details.data.lifetime.rev,
          [],
          0
        );
        let newDTO: Gamer = {
          id: id,
          nickname: latestGame[0].nickname,
          history: {
            amount: details.data.lifetime.rev,
            parsedMatches: matches,
          },
          last_sync: Date.now(),
        };
        await user_store.set(id, newDTO);
      }
    }
  }
};

export const SetSelf = async (nickname: string) => {
  const payload = await GetFaceitIdByName(nickname);
  if (payload && payload.id) {
    const self: Self = {
      name: nickname,
      id: payload.id,
      friendIds: payload.friends,
    };
    UpdateGamer(self.id);
    for (let i = 0; i < self.friendIds.length; i++) {
      UpdateGamer(self.friendIds[i]);
    }
    await self_store.set('self', self);
  }
};

export const GetGamers = () => {
  return user_store.entries<Gamer>();
};

export const GetFaceitIdByName = async (
  name: string
): Promise<Payload | null> => {
  const user = await http.fetch<FaceitUser>(
    baseurl + 'users/v1/nicknames/' + name
  );
  const id = user?.data?.payload?.id;
  const hasPayLoad = id !== null && id !== undefined;
  if (!hasPayLoad) return null;
  return user.data.payload;
};

export const GetGameSpecificDetails = async (id: string) => {
  return await http.fetch<GameSpecificDetails>(
    baseurl + `stats/api/v1/stats/users/${id}/games/csgo`
  );
};

export type PlayerList = {
  name: string;
  id: string;
  matches: ParsedMatch[];
};

export type PlayedTogether = {
  matches: ParsedMatch[];
  players: PlayerList[];
};

export const GetPlayerMatches = async (
  id: string,
  matchamount: number,
  storedMatches: ParsedMatch[],
  prevRev: number
) => {
  let amountToFetch = matchamount;
  let size = 2000;
  let matches: Match[] = [];
  if (matchamount === prevRev && storedMatches.length !== 0)
    return storedMatches;
  if (amountToFetch > prevRev) {
    amountToFetch = amountToFetch - prevRev;
    size = amountToFetch;
  }

  for (let i = 0; i < Math.ceil(amountToFetch / 2000); i++) {
    matches = matches.concat(await FetchMatches(id, i, size));
  }

  return matches
    .filter((m) => m.elo !== undefined)
    .map((m) => parseMatch(m))
    .concat(storedMatches)
    .map((m, i, a) => GetEloChange(m, i, a));
};

const GetEloChange = (m: ParsedMatch, i: number, a: ParsedMatch[]) => {
  if (i === a.length - 1) {
    m.eloChange = 0;
    return m;
  }
  const currentElo = m.elo;
  const previousElo = a[i + 1].elo;
  m.eloChange = currentElo - previousElo;
  return m;
};

const FetchMatches = async (
  playerID: string,
  page: number,
  amount: number
): Promise<Match[]> => {
  const response = await http.fetch<Match[]>(
    baseurl +
      'stats/api/v1/stats/time/users/' +
      playerID +
      '/games/csgo?page=' +
      page +
      '&size=' +
      amount
  );
  if (response.data.length > 0) return response.data;
  return [];
};

export const parseMatch = (match: Match): ParsedMatch => {
  return {
    matchId: match.matchId,
    map: match.i1,
    date: match.date,
    eloChange: 0,
    elo: Number(match.elo),
    HSpercent: Number(match.c4),
    KRratio: Number(match.c3),
    KDratio: Number(match.c2),
    created_at: Number(match.created_at),
    nickname: match.nickname,
    teamId: match.teamId,
    winning_team: match.i2,
  };
};
