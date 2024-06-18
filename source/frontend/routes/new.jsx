import React, { useState } from 'react';
import { useForm, useLoaderResult } from 'react-sprout';
import db from '../database';
import Header from '../components/header';
import BackButton from '../components/back-button';
import { CHECKOUT_TYPE } from './root';

export const SCORE_PRESETS = [101, 170, 301, 501];

export async function newLoader() {
	return db.select('players');
}

export default function New() {
	let players = useLoaderResult();
	let [NewGameForm] = useForm();
	let [playerIds, setPlayerIds] = useState([]);

	function handlePlayerChange(event) {
		let checked = event.target.checked;

		let playerId = event.target.value;
		if (checked) {
			setPlayerIds([...playerIds, playerId]);
		} else {
			setPlayerIds(playerIds.filter(id => id !== playerId));
		}
	}

	return (
		<div className="grid h-full grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center gap-4">
					<BackButton />
					<span>New game</span>
				</h1>
			</Header>

			<NewGameForm
				action="/"
				replace
				method="post"
				className="grid h-full grid-rows-[minmax(0,1fr),max-content] gap-4 p-4 text-xl"
				onActionError={(event, error) => {
					alert(error.message);
				}}
			>
				<div>
					<div>
						<label className="text-base font-medium text-white">Players</label>
						<ul className="mt-2 grid grid-cols-2 gap-4 self-y-start">
							{players.map(player => {
								let index = playerIds.indexOf(player.id);
								return (
									<li key={player.id}>
										<input
											hidden
											readOnly
											type="checkbox"
											id={`player-${player.id}`}
											value={player.id}
											className="peer"
											onChange={handlePlayerChange}
										/>

										<label
											htmlFor={`player-${player.id}`}
											className="flex items-center justify-between rounded-md border-2 border-gray-500 p-4 peer-checked:border-blue-500 peer-checked:bg-blue-500"
										>
											<span>{player.name}</span>
											{index !== -1 ? (
												<span className="inline-flex size-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-blue-500">
													{index + 1}
												</span>
											) : null}
										</label>
									</li>
								);
							})}
						</ul>
					</div>

					<div className="mt-6">
						<label className="text-base font-medium text-white">Score</label>
						<div className="mt-2 grid grid-cols-4 gap-4">
							{SCORE_PRESETS.map(score => (
								<div key={score}>
									<input
										type="radio"
										hidden
										readOnly
										id={`score-${score}`}
										name="score"
										value={score}
										className="peer"
									/>
									<label
										htmlFor={`score-${score}`}
										className="block rounded-md border-2 border-gray-500 p-4 text-center peer-checked:border-blue-500 peer-checked:bg-blue-500"
									>
										{score}
									</label>
								</div>
							))}
						</div>
					</div>

					<div className="mt-6">
						<label className="text-base font-medium text-white">Checkout</label>
						<div className="mt-2 grid grid-cols-3 gap-4">
							{Object.keys(CHECKOUT_TYPE).map(checkout => (
								<div key={checkout}>
									<input
										type="radio"
										hidden
										readOnly
										id={`checkout-${checkout}`}
										name="checkout"
										value={checkout}
										className="peer"
									/>
									<label
										htmlFor={`checkout-${checkout}`}
										className="block rounded-md border-2 border-gray-500 p-4 text-center uppercase peer-checked:border-blue-500 peer-checked:bg-blue-500"
									>
										{checkout}
									</label>
								</div>
							))}
						</div>
					</div>
				</div>

				{playerIds.map(playerId => (
					<input key={playerId} type="hidden" name="playerIds[]" readOnly value={playerId} />
				))}
				<button type="submit" name="intent" value="start_game" className="rounded-md bg-blue-500 p-4 text-2xl">
					Start
				</button>
			</NewGameForm>
		</div>
	);
}
