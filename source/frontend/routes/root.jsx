import React from 'react';

import db from '../database';

const GAME_SCORE = {
	101: 101,
	170: 170,
	301: 301,
	501: 501,
};

const CHECKOUT_TYPES = {
	single: 'SINGLE',
	double: 'DOUBLE',
	triple: 'TRIPLE',
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
			playerIds,
			legs: [],
			score: GAME_SCORE[170],
			checkout: CHECKOUT_TYPES.double,
			startedAt: new Date().getTime(),
		});

		return Response.redirect(`/games/${game.id}`, 303);
	}
}

export default function Root(props) {
	return <div className="p-4">{props.children}</div>;
}
