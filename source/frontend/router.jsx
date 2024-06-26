import React from 'react';
import Routes, { Redirect } from 'react-sprout';
import Home from './routes/home.jsx';
import Game, { gameActions, gameLoader } from './routes/game.jsx';
import Players, { playersActions, playersLoader } from './routes/players.jsx';
import Games, { gamesAction, gamesLoader } from './routes/games.jsx';
import Root, { rootActions } from './routes/root.jsx';
import New, { newLoader } from './routes/new.jsx';
import Player, { playerLoader } from './routes/player.jsx';
import PlayerStats, { playerStatsLoader } from './routes/player-stats.jsx';
import PlayerGames, { playerGamesLoader } from './routes/player-games.jsx';
import Settings, { settingsActions } from './routes/settings.jsx';

export const historyLength = window.history.length;

export default Routes(
	<Root path="." action={rootActions}>
		<Home path="/" />
		<Settings path="settings" action={settingsActions} />

		<New path="new" loader={newLoader} />

		<Games path="games" loader={gamesLoader} action={gamesAction} />
		<Game path="games/:gameId" loader={gameLoader} action={gameActions} />

		<Players path="players" loader={playersLoader} action={playersActions} />

		<Player path="players/:playerId" loader={playerLoader}>
			<PlayerStats path="stats?score&checkout" loader={playerStatsLoader} />
			<PlayerGames path="games?score&checkout" loader={playerGamesLoader} />
		</Player>

		<Redirect path="players/:playerId" to="players/:playerId/stats" />
	</Root>,
);
