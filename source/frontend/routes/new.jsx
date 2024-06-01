import React from 'react';
import { Link, useForm, useLoaderResult } from 'react-sprout';
import db from '../database';
import Header from '../components/header';
import BackIcon from '../components/icons/back-icon';

export async function newLoader() {
	return db.select('players');
}

export default function New() {
	let players = useLoaderResult();
	let [NewGameForm] = useForm();

	return (
		<div className="h-full grid grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center gap-4">
					<Link href=".." push={false}>
						<BackIcon className="size-7" />
					</Link>
					<span>New game</span>
				</h1>
			</Header>

			<NewGameForm action="/" method="post" className="h-full p-4 gap-4 grid grid-rows-[minmax(0,1fr),max-content]">
				<ul className="grid grid-cols-2 self-y-start gap-4">
					{players.map((player) => (
						<li key={player.id}>
							<input
								hidden
								readOnly
								type="checkbox"
								id={`player-${player.id}`}
								name="playerIds[]"
								value={player.id}
								className="peer"
							/>
							<label htmlFor={`player-${player.id}`} className="peer-checked:bg-blue-500">
								{player.name}
							</label>
						</li>
					))}
				</ul>

				<button type="submit" name="intent" value="start_game" className="bg-blue-500 p-4 rounded-md text-2xl">
					Start
				</button>
			</NewGameForm>
		</div>
	);
}
