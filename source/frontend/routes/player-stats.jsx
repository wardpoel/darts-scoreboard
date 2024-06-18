import React from 'react';
import db from '../database';
import { NotFoundError } from 'http-errors';
import { useLoaderResult } from 'react-sprout';

export async function playerStatsLoader(request) {
	let { params, url } = request;
	let score = url.searchParams.get('score') ?? 'all';
	let checkout = url.searchParams.get('checkout') ?? 'all';

	let player = db.find('players', params.playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	let playerGames = db.select('game_players', { playerId: player.id });

	let games = playerGames.filter(playerGame => {
		let game = db.find('games', playerGame.gameId);
		if (score === 'all' && checkout === 'all') return true;
		if (score !== 'all' && checkout === 'all') return game.score.toString() === score;
		if (score === 'all' && checkout !== 'all') return game.checkout.toLowerCase() === checkout.toLowerCase();
		return game.score.toString() === score && game.checkout.toLowerCase() === checkout.toLowerCase();
	});

	let gameWins = 0;
	let gameLosses = 0;
	let totalGames = 0;

	let legWins = 0;
	let legLosses = 0;
	let totalLegs = 0;

	let totalScore = 0;
	let totalDarts = 0;
	for (let playerGame of games) {
		let gameLegs = db.select('legs', { gameId: playerGame.gameId });

		let gameLegWins = gameLegs.filter(leg => leg.winnerId === player.id).length;
		let gameLegLosses = gameLegs.filter(leg => leg.winnerId != undefined && leg.winnerId !== player.id).length;

		legWins += gameLegWins;
		legLosses += gameLegLosses;
		totalLegs += gameLegs.length;

		totalGames++;
		if (gameLegWins > gameLegLosses) gameWins++;
		if (gameLegWins < gameLegLosses) gameLosses++;

		// Get average score in each game
		// let game = db.find('games', playerGame.gameId);
		for (let leg of gameLegs) {
			let throws = db.select('throws', { legId: leg.id, playerId: player.id });
			let { score, darts } = throws.reduce(
				(total, t) => ({ score: total.score + t.score, darts: total.darts + t.darts }),
				{ score: 0, darts: 0 },
			);

			totalScore += score;
			totalDarts += darts;
		}
	}

	let average = totalScore / (totalDarts / 3);
	return { gameWins, gameLosses, totalGames, legWins, legLosses, totalLegs, average, totalScore, totalDarts };
}

function isWinningPercentagePositive(percentage) {
	return percentage >= 50;
}

export default function PlayerStats() {
	let { gameWins, gameLosses, totalGames, legWins, legLosses, totalLegs, average, totalDarts } = useLoaderResult();

	return (
		<div className="p-4">
			{totalGames > 0 ? (
				<div className="grid grid-cols-2 gap-4 proportional-nums">
					<StatCard title="3 Dart average" number={average.toFixed(2)} />
					<StatCard title="Darts thrown" number={totalDarts} />

					<StatCard title="Game wins" number={gameWins} total={totalGames} isPositive={isWinningPercentagePositive} />
					<StatCard title="Game losses" number={gameLosses} total={totalGames} />
					<StatCard title="Leg wins" number={legWins} total={totalLegs} isPositive={isWinningPercentagePositive} />
					<StatCard title="Leg losses" number={legLosses} total={totalLegs} />
				</div>
			) : (
				<p className="text-gray-400">No games played yet</p>
			)}
		</div>
	);
}

function StatCard(props) {
	let { title, number, total, isPositive } = props;

	let percentage = (number / total) * 100;
	return (
		<div className="flex flex-col rounded-md bg-gray-700 px-4 py-2 shadow">
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-gray-400">{title}</span>
				{!isNaN(percentage) && isPositive != undefined ? (
					<span
						data-positive={isPositive?.(percentage)}
						data-negative={!isPositive(percentage)}
						className="text-xs font-light self-x-end self-y-center data-[negative=true]:text-red-400 data-[positive=true]:text-green-400"
					>
						{percentage.toFixed(0)}%
					</span>
				) : null}
			</div>
			<div className="">
				<span className="text-5xl">{number}</span>&nbsp;
				{total != undefined ? <span className="text-sm font-light text-gray-400">/ {total}</span> : null}
			</div>
		</div>
	);
}
