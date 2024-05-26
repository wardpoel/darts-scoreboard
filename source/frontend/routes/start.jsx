import { useSelect } from 'key-value-database';
import React from 'react';
import { useForm } from 'react-sprout';
import db from '../database';

export default function Start() {
	let [StartGameForm] = useForm();
	let players = useSelect(db, 'players');

	return (
		<StartGameForm action="/" method="post">
			<h1>Start Game</h1>

			{players.map((player) => (
				<div key={player.id}>
					<input type="checkbox" id={`player-${player.id}`} name="playerIds[]" value={player.id} />
					<label htmlFor={`player-${player.id}`}>{player.name}</label>
				</div>
			))}

			<button type="submit" name="intent" value="start_game">
				Start Game
			</button>
		</StartGameForm>
	);
}
