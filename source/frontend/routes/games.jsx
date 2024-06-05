import React, { Suspense } from 'react';

import { Link, useLoaderResult } from 'react-sprout';

import Header from '../components/header';
import db from '../database';
import BackButton from '../components/back-button';
import { DateFormat } from '../utils/date-time';

export async function gamesAction({ data }) {
	let { intent } = data;

	if (intent === 'delete_game') {
		let { gameId } = data;
		let game = db.delete('games', gameId);

		// Delete all players in the game
		db.delete('game_players', { gameId });

		// Delete all legs and throws in the game
		let legs = db.select('legs', { gameId });
		for (let leg of legs) {
			db.delete('legs', leg.id);
			db.delete('throws', { legId: leg.id });
		}

		return game;
	}
}

export async function gamesLoader() {
	let games = db.select('games');

	for (let game of games) {
		let gamePlayers = db.select('game_players', { gameId: game.id });
		let players = [];
		for (let gamePlayer of gamePlayers) {
			let player = db.find('players', gamePlayer.playerId);
			if (player == undefined) continue;

			players.push(player);
		}

		game.players = players;

		// Get score for each game
		let legs = db.select('legs', { gameId: game.id });
		let scores = {};
		for (let player of players) {
			scores[player.id] = 0;
		}

		for (let leg of legs) {
			if (leg.winnerId == undefined) continue;
			scores[leg.winnerId] = scores[leg.winnerId] + 1;
		}

		game.scores = scores;
	}

	return games;
}

export default function Games() {
	return (
		<div className="grid h-full max-h-screen grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center gap-4">
					<BackButton />
					<span>Games</span>
				</h1>
			</Header>

			<Suspense>
				<GamesView />
			</Suspense>
		</div>
	);
}

function GamesView() {
	let games = useLoaderResult();

	return (
		<div className="grid max-h-screen grid-cols-1 grid-rows-[minmax(0,1fr),max-content] overflow-y-auto">
			<ul className="grid max-h-full grid-cols-1 divide-y divide-gray-700 overflow-y-auto py-1 self-y-start">
				{games.map(game => (
					<GameListItem key={game.id} game={game} />
				))}
			</ul>

			<Link href="/new" className="m-4 flex flex-col gap-2 rounded-md bg-blue-500 p-4 text-center text-2xl">
				New game
			</Link>
		</div>
	);
}

function GameListItem(props) {
	let { game } = props;

	return (
		<li>
			<Link href={game.id} className="flex items-center justify-between px-4 py-3 active:bg-gray-700" cache>
				<div className="flex flex-col leading-tight">
					<div className="flex items-baseline gap-2">
						<span className="text-lg font-medium">
							{game.score} {game.checkout} out
						</span>
						<span className="text-xs font-light text-gray-400">{DateFormat.format(new Date(game.createdAt))}</span>
					</div>
					<span className="font-light text-gray-400">{game.players.map(p => p.name).join(' - ')}</span>
				</div>
				<div className="flex gap-2">
					{Object.entries(game.scores).map(([playerId, score]) => (
						<span
							key={playerId}
							className="inline-flex size-8 items-center justify-center rounded-full bg-violet-500 proportional-nums"
						>
							{score}
						</span>
					))}
				</div>
			</Link>
		</li>
	);
}
