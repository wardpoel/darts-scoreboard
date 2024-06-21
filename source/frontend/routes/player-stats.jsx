import React from 'react';
import db from '../database';
import { NotFoundError } from 'http-errors';
import { useLoaderResult } from 'react-sprout';
import { SCORE_PRESETS } from './new';
import { CHECKOUT_TYPE } from './root';

export async function playerStatsLoader(request) {
	let { params, url } = request;
	let score = url.searchParams.get('score') ?? 'all';
	let checkout = url.searchParams.get('checkout') ?? 'all';

	let player = db.selectById('players', params.playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	let scores = [...SCORE_PRESETS];
	let checkouts = [...Object.values(CHECKOUT_TYPE)];

	if (score !== 'all') scores = [score];
	if (checkout !== 'all') checkouts = [checkout];

	let stat = db.selectById('stats', player.statId);

	let total = {
		legs: { wins: 0, losses: 0, played: 0 },
		games: { wins: 0, losses: 0, played: 0 },
		total: 0,
		darts: 0,
	};
	for (let score of scores) {
		for (let checkout of checkouts) {
			let current = stat[score][checkout];

			total.games.wins += current.games.wins;
			total.games.losses += current.games.losses;
			total.games.played += current.games.played;
			total.legs.wins += current.legs.wins;
			total.legs.losses += current.legs.losses;
			total.legs.played += current.legs.played;
			total.total += current.total;
			total.darts += current.darts;
		}
	}

	return total;
}

function isWinningPercentagePositive(percentage) {
	return percentage >= 50;
}

export default function PlayerStats() {
	let { games, legs, darts, total } = useLoaderResult();

	let average = total / (darts / 3);
	return (
		<div className="px-4 pb-4">
			{games.played > 0 ? (
				<div className="grid grid-cols-2 gap-4 proportional-nums">
					<StatCard title="3 Dart average" number={average.toFixed(2)} />
					<StatCard title="Darts thrown" number={darts} />

					<StatCard
						title="Game wins"
						number={games.wins}
						total={games.played}
						isPositive={isWinningPercentagePositive}
					/>
					<StatCard title="Game losses" number={games.losses} total={games.played} />
					<StatCard title="Leg wins" number={legs.wins} total={legs.played} isPositive={isWinningPercentagePositive} />
					<StatCard title="Leg losses" number={legs.losses} total={legs.played} />
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
