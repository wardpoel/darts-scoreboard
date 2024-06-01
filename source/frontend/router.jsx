import React from 'react';
import Routes from 'react-sprout';
import Home from './routes/home.jsx';
import Game, { gameActions } from './routes/game.jsx';
import Players, { playerActions } from './routes/players.jsx';
import Games from './routes/games.jsx';
import Root, { rootActions } from './routes/root.jsx';
import New from './routes/new.jsx';
import Player, { playerLoader } from './routes/player.jsx';

export default Routes(
	<Root path="." action={rootActions}>
		<Home path="/" />

		<New path="new" />

		<Games path="games" />
		<Game path="games/:gameId" action={gameActions} />

		<Players path="players" action={playerActions} />
		<Player path="players/:playerId" loader={playerLoader} />
	</Root>
);
