import React from 'react';
import Routes from 'react-sprout';
import Home from './routes/home.jsx';
import Game from './routes/game.jsx';
import Players, { playerActions } from './routes/players.jsx';
import Start from './routes/start.jsx';
import Games from './routes/games.jsx';
import Root, { rootActions } from './routes/root.jsx';

export default Routes(
	<Root path="." action={rootActions}>
		<Home path="/" />

		<Start path="start" />

		<Games path="games" />
		<Game path="games/:gameId" />

		<Players path="players" action={playerActions} />
	</Root>
);
