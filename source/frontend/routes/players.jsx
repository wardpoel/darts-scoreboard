import React, { useRef } from 'react';

import { NotImplementedError } from 'http-errors';
import db from '../database';
import { useSelect } from 'key-value-database';
import { Link, useForm } from 'react-sprout';
import Header from '../components/header';
import BackIcon from '../components/icons/back-icon';

export async function playerActions({ data }) {
	let intent = data.intent;

	if (intent === 'add_player') {
		let name = data.name;
		let player = db.create('players', { name });
		return player;
	}

	throw new NotImplementedError(`Unknown intent: ${intent} not known`);
}

export default function Players() {
	let players = useSelect(db, 'players');
	let [AddPlayerForm] = useForm();
	let addPlayerFormRef = useRef();

	return (
		<div>
			<Header>
				<h1 className="flex items-center gap-4">
					<Link href=".." push={false}>
						<BackIcon className="size-7" />
					</Link>
					<span>Players</span>
				</h1>
			</Header>

			<ul className="p-4">
				{players.map((player) => (
					<li key={player.id}>{player.name}</li>
				))}

				<li>
					<AddPlayerForm
						ref={addPlayerFormRef}
						action="/players"
						method="post"
						onNavigateEnd={() => addPlayerFormRef.current.reset()}
					>
						<input type="text" name="name" placeholder="Name" required />
						<button type="submit" name="intent" value="add_player">
							Add
						</button>
					</AddPlayerForm>
				</li>
			</ul>
		</div>
	);
}
