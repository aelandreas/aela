import { useQuery } from 'react-query';
import { Gamer, UpdateGamer } from './api';
import Card from './Card';

type props = {
  player: Gamer;
  onClick: () => void;
  showCurrentElo?: boolean;
  selected?: boolean;
};

const PlayerStats: React.FC<props> = ({
  player,
  onClick,
  selected,
  showCurrentElo,
}) => {
  useQuery(['Gamer'], () => UpdateGamer(player.id), {
    enabled:
      selected ||
      player.history === undefined ||
      player.history.amount === 0 ||
      player.nickname === '',
  });

  const getKd = () =>
    (
      player.history.parsedMatches
        .map((match) => match.KDratio)
        .reduce((acc, match) => acc + match) /
      player.history.parsedMatches.length
    ).toFixed(2);

  const getKR = () =>
    (
      player.history.parsedMatches
        .map((match) => match.KRratio)
        .reduce((acc, match) => acc + match) /
      player.history.parsedMatches.length
    ).toFixed(2);

  const getHS = () =>
    (
      player.history.parsedMatches
        .map((match) => match.HSpercent)
        .reduce((acc, match) => acc + match) /
      player.history.parsedMatches.length
    ).toFixed(2) + '%';

  const getElo = () => {
    return player.history.parsedMatches
      .map((match) => match.eloChange)
      .reduce((acc, match) => acc + match, 0);
  };

  if (player?.history?.parsedMatches && player.history.parsedMatches.length > 0)
    return (
      <Card
        header={player.nickname.length > 0 ? player.nickname : player.id}
        selected={selected}
        onClick={onClick}
      >
        <div>
          <div className="card-text">{'KD: ' + getKd()} </div>
          <div className="card-text">{'HS: ' + getHS()}</div>
          <div className="card-text">{'KR: ' + getKR()}</div>
          <div className="card-text">{'Elo: ' + getElo()}</div>
          {showCurrentElo && (
            <div className="card-text">
              {'Current elo: ' + player.history.parsedMatches[0]?.elo ??
                'Unknown'}
            </div>
          )}
          {selected && (
            <div className="card-text">
              {player.history.parsedMatches.length} matches
            </div>
          )}
        </div>
      </Card>
    );
  if (player.history.amount === 0 && player.history.parsedMatches.length === 0)
    return <></>;
  return <Card header="Loading..."></Card>;
};

export default PlayerStats;
