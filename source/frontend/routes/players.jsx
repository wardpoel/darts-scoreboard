import React from 'react';

import { NotImplementedError } from 'http-errors';
import db from '../database';
import { Link, useForm, useLoaderResult } from 'react-sprout';
import Header from '../components/header';
import BackButton from '../components/back-button';
import Suspense from '../components/suspense';
import { SCORE_PRESETS } from './new';
import { CHECKOUT_TYPE } from './root';

export async function playersActions({ data }) {
	let intent = data.intent;

	if (intent === 'add_player') {
		let name = data.name;

		let emptyStat = {};
		for (let score of SCORE_PRESETS) {
			emptyStat[score] = {};
			for (let checkout of Object.values(CHECKOUT_TYPE)) {
				emptyStat[score][checkout] = {
					legs: { wins: 0, losses: 0, played: 0 },
					games: { wins: 0, losses: 0, played: 0 },
					total: 0,
					darts: 0,
				};
			}
		}

		// Create a new player with an empty stat
		let stat = db.create('stats', { ...emptyStat, createdAt: Date.now(), updatedAt: Date.now() });
		let player = db.create('players', { name, statId: stat.id });

		return player;
	}

	if (intent === 'delete_player') {
		let playerId = data.playerId;
		let player = db.delete('players', playerId);
		let playerGames = db.select('game_players', { playerId });

		for (let playerGame of playerGames) {
			// Remove the game
			db.delete('games', playerGame.gameId);
			db.delete('game_players', playerGames.id);

			// Remove all the legs for this game and all the throws for those legs
			let legs = db.select('legs', { gameId: playerGame.gameId });
			for (let leg of legs) {
				db.delete('throws', { legId: leg.id });
				db.delete('legs', leg.id);
			}
		}

		return player;
	}

	throw new NotImplementedError(`Unknown intent: ${intent} not known`);
}

export async function playersLoader() {
	let players = db.select('players');

	for (let player of players) {
		player.stats = db.selectById('stats', player.statId);
	}

	players = players.sort((playerA, playerZ) => {
		let scoreA = 0;
		let scoreZ = 0;

		for (let score of SCORE_PRESETS) {
			for (let checkout of Object.values(CHECKOUT_TYPE)) {
				scoreA += playerA.stats[score][checkout].games.played;
				scoreZ += playerZ.stats[score][checkout].games.played;
			}
		}

		return scoreZ - scoreA;
	});

	return players;
}

export default function Players() {
	return (
		<div className="grid h-full grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center gap-4">
					<BackButton />
					<span>Players</span>
				</h1>
			</Header>

			<Suspense>
				<PlayersView />
			</Suspense>
		</div>
	);
}

function PlayersView() {
	let players = useLoaderResult();
	let [AddPlayerForm] = useForm();

	return (
		<div className="grid max-h-screen grid-cols-1 grid-rows-[minmax(0,1fr),max-content] overflow-y-auto">
			<ul className="grid max-h-full grid-cols-1 divide-y divide-gray-700 overflow-y-auto py-1 self-y-start">
				{players.map(player => (
					<PlayerListItem key={player.id} player={player} />
				))}
			</ul>

			<AddPlayerForm
				action="/players"
				method="post"
				className="m-4 flex flex-col gap-2"
				onNavigateEnd={event => {
					event.originalEvent.target.reset();
				}}
			>
				<input type="text" name="name" placeholder="Name" required className="rounded-md p-4 text-2xl text-gray-800" />
				<button
					type="submit"
					name="intent"
					value="add_player"
					className="flex-shrink-0 rounded-md bg-blue-500 p-4 text-center text-2xl"
				>
					Add
				</button>
			</AddPlayerForm>
		</div>
	);
}

function PlayerListItem(props) {
	let { player } = props;
	return (
		<li>
			<Link href={player.id} className="block px-4 py-3 text-lg active:bg-gray-700" cache>
				{player.name}
			</Link>
		</li>
	);
}
