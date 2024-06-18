import React from 'react';
import db from '../database';
import { NotFoundError } from 'http-errors';
import { useLoaderResult, useLocation, useNavigate } from 'react-sprout';
import { SCORE_PRESETS } from './new';
import { CHECKOUT_TYPE } from './root';

export async function playerStatsLoader(request) {
	let { params } = request;
	let score = request.url.searchParams.get('score') ?? 'all';
	let checkout = request.url.searchParams.get('checkout') ?? 'all';

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
	let [navigate] = useNavigate();
	let location = useLocation();

	let searchParams = location.searchParams;
	let currentScore = searchParams.get('score') ?? 'all';
	let currentCheckout = searchParams.get('checkout') ?? 'all';

	function handleScoreChange(event) {
		let value = event.target.value;

		let searchParams = new URLSearchParams(location.search);
		searchParams.set('score', value);

		navigate(`?${searchParams.toString()}`, { replace: true });
	}

	function handleCheckoutChange(event) {
		let value = event.target.value;

		let searchParams = new URLSearchParams(location.search);
		searchParams.set('checkout', value);

		navigate(`?${searchParams.toString()}`, { replace: true });
	}

	return (
		<div className="p-4">
			<div className="grid grid-cols-5 gap-4">
				{['all', ...SCORE_PRESETS].map(score => (
					<div key={score}>
						<input
							type="radio"
							hidden
							readOnly
							id={`score-${score}`}
							name="score"
							value={score}
							checked={currentScore === score.toString()}
							className="peer"
							onChange={handleScoreChange}
						/>
						<label
							htmlFor={`score-${score}`}
							className="block rounded-md border-2 border-gray-500 p-4 text-center uppercase peer-checked:border-blue-500 peer-checked:bg-blue-500"
						>
							{score}
						</label>
					</div>
				))}
			</div>

			<div className="mt-4 grid grid-cols-4 gap-4">
				{['all', ...Object.keys(CHECKOUT_TYPE)].map(checkout => (
					<div key={checkout}>
						<input
							type="radio"
							hidden
							readOnly
							id={`checkout-${checkout}`}
							name="checkout"
							value={checkout}
							checked={currentCheckout === checkout}
							className="peer"
							onChange={handleCheckoutChange}
						/>
						<label
							htmlFor={`checkout-${checkout}`}
							className="block rounded-md border-2 border-gray-500 p-4 text-center uppercase peer-checked:border-blue-500 peer-checked:bg-blue-500"
						>
							{checkout}
						</label>
					</div>
				))}
			</div>

			<div className="mt-4">
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
