import React from 'react';
import { useParams } from 'react-sprout';
import { useFind } from 'key-value-database';

import db from '../database';
import { NotFoundError } from 'http-errors';

export async function gameActions({ data }) {
	let intent = data.intent;

	if (intent === 'add_score') {
		let totalPlayers = db.count('players');
		if (totalPlayers < 2) throw new Error('Not enough players to start the game');
	}
}

export default function Game() {
	let { gameId } = useParams();
	let game = useFind(db, 'games', gameId);
	if (game == undefined) throw new NotFoundError('Game not found');

	return (
		<div>
			<h1>Game: {game.id}</h1>
			<ul>
				{game.players.map((player) => (
					<li key={player.id}>{player.name}</li>
				))}
			</ul>
		</div>
	);
}
