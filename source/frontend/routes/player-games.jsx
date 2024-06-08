import React from 'react';
import db from '../database';
import { NotFoundError } from 'http-errors';

export async function playerGamesLoader(request) {
	let { params } = request;

	let player = db.find('players', params.playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	let playerGames = db.select('game_players', { playerId: player.id });

	let wins = 0;
	let losses = 0;
	let totalGames = 0;
	for (let playerGame of playerGames) {
		let gameLegs = db.select('legs', { gameId: playerGame.gameId });

		let gameLegWins = gameLegs.filter(leg => leg.winnerId === player.id).length;
		let gameLegLosses = gameLegs.filter(leg => leg.winnerId != undefined && leg.winnerId !== player.id).length;

		if (gameLegWins === gameLegLosses) continue;

		if (gameLegWins > gameLegLosses) wins++;
		if (gameLegWins < gameLegLosses) losses++;
		totalGames++;
	}

	return { wins, losses, totalGames };
}

export default function PlayerGames() {
	return <div className="p-4">Games</div>;
}
