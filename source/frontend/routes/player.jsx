import React from 'react';
import Header from '../components/header';
import { Link, useForm, useLoaderResult } from 'react-sprout';
import db from '../database';
import { NotFoundError } from 'http-errors';
import BackIcon from '../components/icons/back-icon';

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
			<Header>
				<h1 className="flex items-center gap-4">
					<Link href=".." push={false}>
						<BackIcon className="size-7" />
					</Link>
					<span>{player.name}</span>
				</h1>
			</Header>

			<DeletePlayerForm action="/players" method="post">
				<input name="playerId" value={player.id} type="hidden" readOnly />
				<button type="submit" name="intent" value="delete_player">
					Delete
				</button>
			</DeletePlayerForm>
		</div>
	);
}
