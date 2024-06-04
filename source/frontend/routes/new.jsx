import React from 'react';
import { useForm, useLoaderResult } from 'react-sprout';
import db from '../database';
import Header from '../components/header';
import BackButton from '../components/back-button';

export async function newLoader() {
	return db.select('players');
}

export default function New() {
	let players = useLoaderResult();
	let [NewGameForm] = useForm();

	return (
		<div className="grid h-full grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center gap-4">
					<BackButton />
					<span>New game</span>
				</h1>
			</Header>

			<NewGameForm action="/" method="post" className="grid h-full grid-rows-[minmax(0,1fr),max-content] gap-4 p-4">
				<ul className="grid grid-cols-2 gap-4 self-y-start">
					{players.map(player => (
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

				<button type="submit" name="intent" value="start_game" className="rounded-md bg-blue-500 p-4 text-2xl">
					Start
				</button>
			</NewGameForm>
		</div>
	);
}
