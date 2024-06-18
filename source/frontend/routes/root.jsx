import React from 'react';

import db from '../database';
import { BadRequestError } from 'http-errors';
import Suspense from '../components/suspense';

export const CHECKOUT_TYPE = {
	single: 'single',
	double: 'double',
	triple: 'triple',
};

export async function rootActions({ data }) {
	let intent = data.intent;

	if (intent === 'start_game') {
		let totalPlayers = db.count('players');
		if (totalPlayers < 2) throw new BadRequestError('Not enough players to start the game');

		let { playerIds, score: rawScore, checkout } = data;
		if (playerIds.length < 2) throw new BadRequestError('Select atleast two players to start a game');
		if (playerIds > 4) throw new BadRequestError('Select a maximum of four players to start a game');

		let score = parseInt(rawScore, 10);
		if (isNaN(score)) throw new BadRequestError('Please select a valid score');

		if (Object.values(CHECKOUT_TYPE).indexOf(checkout) === -1) {
			throw new BadRequestError('Please select a valid checkout type');
		}

		let game = db.create('games', {
			score,
			checkout,
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
	return (
		<div className="mx-auto h-full w-full max-w-screen-md md:p-4">
			<div className="h-full w-full bg-gray-800 text-white">
				<Suspense>{props.children}</Suspense>
			</div>
		</div>
	);
}
