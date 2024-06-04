import React from 'react';
import Routes from 'react-sprout';
import Home from './routes/home.jsx';
import Game, { gameActions, gameLoader } from './routes/game.jsx';
import Players, { playerActions, playerLoaders } from './routes/players.jsx';
import Games, { gamesLoader } from './routes/games.jsx';
import Root, { rootActions } from './routes/root.jsx';
import New, { newLoader } from './routes/new.jsx';
import Player, { playerLoader } from './routes/player.jsx';

export const historyLength = window.history.length;

export default Routes(
	<Root path="." action={rootActions}>
		<Home path="/" />

		<New path="new" loader={newLoader} />

		<Games path="games" loader={gamesLoader} />
		<Game path="games/:gameId" loader={gameLoader} action={gameActions} />

		<Players path="players" loader={playerLoaders} action={playerActions} />
		<Player path="players/:playerId" loader={playerLoader} />
	</Root>,
);
