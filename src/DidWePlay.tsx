import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Gamer, GetGamers, GetSelf, ParsedMatch, SetSelf } from './api';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import PlayerStats from './PlayerStats';
import useInput from './useInput';
import { useEffect, useState } from 'react';
import Card from './Card';

const DidWePlay: React.FC = () => {
  const [parent] = useAutoAnimate<HTMLDivElement>();
  const input = useInput();
  const [selectedPlayers, setSelectedPlayers] = useState<Gamer[]>([]);
  const [commonMatches, setCommonMatches] = useState<Set<string>>(
    new Set<string>()
  );
  const { data: self } = useQuery(['self'], () => GetSelf(), {
    refetchOnWindowFocus: false,
  });

  const unsetSelectedPlayers = (player: Gamer) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
  };

  const selectPlayer = (player: Gamer) => {
    setSelectedPlayers([...selectedPlayers, player]);
  };
  const queryClient = useQueryClient();

  const { mutate: updateSelf, isLoading: updating } = useMutation(SetSelf, {
    onSettled: () => {
      queryClient.invalidateQueries(['players']);
    },
  });

  const {
    data: allPlayers,
    isLoading,
    isFetching,
    isIdle,
  } = useQuery(['players'], GetGamers, {
    refetchOnWindowFocus: true,
  });

  const GetMatchesInCommon = (player: Gamer) => {
    if (commonMatches.size === 0) return player.history.parsedMatches;
    const matches = player.history.parsedMatches.filter((m) =>
      commonMatches.has(m.matchId + m.teamId)
    );
    return matches;
  };

  useEffect(() => {
    if (selectedPlayers.length === 0) {
      setCommonMatches(new Set<string>());
      return;
    }
    if (selectedPlayers.length === 1) {
      setCommonMatches(
        new Set<string>(
          selectedPlayers[0].history.parsedMatches.map(
            (m) => m.matchId + m.teamId
          )
        )
      );
      return;
    }

    let matches: ParsedMatch[] = [];
    for (let i = 0; i < selectedPlayers.length; i++) {
      if (i === 0) {
        matches = selectedPlayers[i].history.parsedMatches;
      } else {
        matches = matches.filter((m) =>
          selectedPlayers[i].history.parsedMatches.some(
            (m2) => m2.matchId === m.matchId && m2.teamId === m.teamId
          )
        );
      }
    }
    setCommonMatches(new Set<string>(matches.map((m) => m.matchId + m.teamId)));
  }, [selectedPlayers]);

  return (
    <>
      <div className="panel">
        <h1>Control panel</h1>
        <div className="analyze">
          <input
            className="input neu"
            type="text"
            placeholder="Write your faceit nickname"
            onChange={(e) => input.setText(e.target.value)}
            disabled={isLoading || isFetching}
            defaultValue={self?.name}
          />
          {self && <p>{self.friendIds.length} FaceIT friends</p>}
          {self && <p>{self.id}</p>}
          <button
            className={'neu' + (updating ? ' loading' : ' ')}
            onClick={() => updateSelf(input.text)}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching
              ? 'Fetching a lot of data... This might take a while'
              : 'Update'}
          </button>
        </div>
      </div>
      <div className="panel">
        <h1>Selected players</h1>
        <div className="players" ref={parent}>
          {selectedPlayers.length > 0 &&
            selectedPlayers.map((player) => (
              <PlayerStats
                key={player.id + '-' + player.nickname}
                player={{
                  ...player,
                  history: {
                    parsedMatches: GetMatchesInCommon(player),
                    amount: 0,
                  },
                }}
                onClick={() => unsetSelectedPlayers(player)}
                selected
                showCurrentElo={false}
              />
            ))}
        </div>
      </div>
      <div className="panel" ref={parent}>
        <h1>Players</h1>
        <p>These players have matches in common with the selected players.</p>
        {(isLoading || isFetching) && <Card header="Loading..."></Card>}
        {isIdle && !allPlayers && <Card header="No players.."></Card>}
        <div className="players">
          {self &&
            allPlayers &&
            allPlayers
              .filter(
                (player) =>
                  selectedPlayers.length === 0 ||
                  !selectedPlayers.some((p) => p.id === player[1].id)
              )
              .sort((a, b) => a[1].nickname.localeCompare(b[1].nickname))
              .map((player) => (
                <PlayerStats
                  key={player[0]}
                  player={{
                    ...player[1],
                    history: {
                      parsedMatches: GetMatchesInCommon(player[1]),
                      amount: 0,
                    },
                  }}
                  onClick={() => selectPlayer(player[1])}
                  showCurrentElo={selectedPlayers.length === 0}
                />
              ))}
        </div>
      </div>
    </>
  );
};

export default DidWePlay;
