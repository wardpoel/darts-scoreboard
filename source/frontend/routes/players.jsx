import React, { useRef } from 'react';

import { NotImplementedError } from 'http-errors';
import db from '../database';
import { useSelect } from 'key-value-database';
import { useForm } from 'react-sprout';

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
		<ul>
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
	);
}
