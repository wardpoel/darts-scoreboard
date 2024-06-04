import React, { Suspense } from 'react';

import { NotImplementedError } from 'http-errors';
import db from '../database';
import { Link, useForm, useLoaderResult } from 'react-sprout';
import Header from '../components/header';
import PlayerName from '../components/player-name';
import BackButton from '../components/back-button';

export async function playerActions({ data }) {
	let intent = data.intent;

	if (intent === 'add_player') {
		let name = data.name;
		let player = db.create('players', { name });
		return player;
	}

	if (intent === 'delete_player') {
		let playerId = data.playerId;
		db.delete('players', playerId);
		return;
	}

	throw new NotImplementedError(`Unknown intent: ${intent} not known`);
}

export async function playerLoaders() {
	return db.select('players');
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
		<div className="grid h-full grid-cols-1 grid-rows-[minmax(0,1fr),max-content] overflow-y-auto">
			<ul className="grid max-h-full grid-cols-1 divide-y divide-gray-700 overflow-y-auto py-1 self-y-start">
				{players.map(player => (
					<PlayerListItem key={player.id} id={player.id} />
				))}
			</ul>

			<AddPlayerForm
				action="/players"
				method="post"
				className="flex flex-col gap-2 p-4"
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
	let { id } = props;
	return (
		<li>
			<Link href={id} className="block px-4 py-3 text-lg active:bg-gray-700" cache>
				<PlayerName id={id} />
			</Link>
		</li>
	);
}
