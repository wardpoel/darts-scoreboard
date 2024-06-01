import React from 'react';
import Header from '../components/header';
import { useForm, useLoaderResult } from 'react-sprout';
import db from '../database';
import { NotFoundError } from 'http-errors';

export async function playerLoader(request) {
	let { params } = request;

	let player = db.find('players', params.playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	return player;
}

export default function Player() {
	let player = useLoaderResult();
	let [DeletePlayerForm] = useForm();

	return (
		<div>
			<Header>{player.name}</Header>

			<DeletePlayerForm action="/players" method="post">
				<input name="playerId" value={player.id} type="hidden" readOnly />
				<button type="submit" name="intent" value="delete_player">
					Delete
				</button>
			</DeletePlayerForm>
		</div>
	);
}
