import React, { useRef } from 'react';

import { NotImplementedError } from 'http-errors';
import db from '../database';
import { Link, useForm, useLoaderResult } from 'react-sprout';
import Header from '../components/header';
import BackIcon from '../components/icons/back-icon';
import PlayerName from '../components/player-name';

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
	let players = useLoaderResult();
	let [AddPlayerForm] = useForm();
	let addPlayerFormRef = useRef();

	return (
		<div className="grid grid-rows-[max-content,auto] h-full">
			<Header>
				<h1 className="flex items-center gap-4">
					<Link href=".." push={false}>
						<BackIcon className="size-7" />
					</Link>
					<span>Players</span>
				</h1>
			</Header>

			<div className="h-full grid grid-rows-[minmax(0,1fr),max-content] grid-cols-1 overflow-y-auto">
				<ul className="py-1 self-y-start grid grid-cols-1 divide-y divide-gray-700 max-h-full overflow-y-auto">
					{players.map((player) => (
						<PlayerListItem key={player.id} id={player.id} />
					))}
				</ul>

				<AddPlayerForm
					ref={addPlayerFormRef}
					action="/players"
					method="post"
					className="p-4 flex flex-col gap-2"
					onNavigateEnd={() => addPlayerFormRef.current.reset()}
				>
					<input
						type="text"
						name="name"
						placeholder="Name"
						required
						className="rounded-md p-4 text-2xl text-gray-800"
					/>
					<button
						type="submit"
						name="intent"
						value="add_player"
						className="bg-blue-500 flex-shrink-0 text-center text-2xl rounded-md p-4"
					>
						Add
					</button>
				</AddPlayerForm>
			</div>
		</div>
	);
}

function PlayerListItem(props) {
	let { id } = props;
	return (
		<li>
			<Link href={id} className="block px-4 py-3 active:bg-gray-700 text-lg">
				<PlayerName id={id} />
			</Link>
		</li>
	);
}
