import React from 'react';
import Header from '../components/header';
import { useForm, useLoaderResult } from 'react-sprout';
import db from '../database';
import { NotFoundError } from 'http-errors';
import BackButton from '../components/back-button';
import TrashIcon from '../components/icons/trash-icon';

export async function playerLoader(request) {
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

	player.wins = wins;
	player.losses = losses;
	player.totalGames = totalGames;

	return player;
}

export default function Player() {
	let player = useLoaderResult();
	let [DeletePlayerForm] = useForm();

	return (
		<div>
			<Header>
				<h1 className="flex items-center justify-between">
					<span className="flex items-center gap-4">
						<BackButton />
						<span>{player.name}</span>
					</span>

					<DeletePlayerForm
						action="/players"
						method="post"
						replace
						className="contents"
						onSubmit={event => {
							const ok = confirm('Are you sure you want to delete this player?');
							if (ok) return;
							event.preventDefault();
						}}
					>
						<input name="playerId" value={player.id} type="hidden" readOnly />
						<button type="submit" name="intent" value="delete_player" className="-m-2 p-2">
							<TrashIcon className="size-7" />
						</button>
					</DeletePlayerForm>
				</h1>
			</Header>

			<main className="grid grid-cols-2 gap-4 p-4 proportional-nums">
				<StatCard title="Wins" number={player.wins} total={player.totalGames} isPositive={perc => perc >= 50} />
				<StatCard title="Losses" number={player.losses} total={player.totalGames} isPositive={perc => perc < 50} />
			</main>
		</div>
	);
}

function StatCard(props) {
	let { title, number, total, isPositive } = props;

	let percentage = (number / total) * 100;
	return (
		<div className="grid grid-cols-2 rounded-md border-2 border-gray-500 px-4 py-2 text-right items-x-start">
			<span className="text-sm font-semibold text-gray-200">{title}</span>
			<span
				data-positive={isPositive(percentage)}
				data-negative={!isPositive(percentage)}
				className="text-xs font-light self-x-end self-y-center data-[negative=true]:text-red-400 data-[positive=true]:text-green-400"
			>
				{percentage.toFixed(0)}%
			</span>
			<div className="col-span-2">
				<span className="text-5xl">{number}</span>&nbsp;
				<span className="text-sm font-light text-gray-300">/ {total}</span>
			</div>
		</div>
	);
}
