import React from 'react';

import db from '../database';

const GAME_SCORE = {
	101: 101,
	170: 170,
	301: 301,
	501: 501,
};

export const CHECKOUT_TYPE = {
	single: 'Single',
	double: 'Double',
	triple: 'Triple',
};

export async function rootActions({ data }) {
	let intent = data.intent;

	if (intent === 'start_game') {
		let totalPlayers = db.count('players');
		if (totalPlayers < 2) throw new Error('Not enough players to start the game');

		let { playerIds } = data;
		if (playerIds.length < 2) throw new Error('Select atleast two players to start a game');
		if (playerIds > 4) throw new Error('Select a maximum of four players to start a game');

		let game = db.create('games', {
			score: GAME_SCORE[170],
			checkout: CHECKOUT_TYPE.double,
			createdAt: Date.now(),
		});
		for (let playerId of playerIds) {
			db.create('game_players', {
				gameId: game.id,
				playerId,
			});
		}

		return Response.redirect(`/games/${game.id}`, 303);
	}
}

export default function Root(props) {
	return <div className="max-w-screen-sm bg-gray-800 text-white mx-auto w-full h-full">{props.children}</div>;
}
