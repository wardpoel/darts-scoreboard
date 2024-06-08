import React, { useEffect, useRef, useState } from 'react';
import { useForm, useLoaderResult } from 'react-sprout';

import db from '../database';
import { BadRequestError, NotFoundError } from 'http-errors';
import Header from '../components/header';
import checkouts from '../utils/checkouts';
import { CHECKOUT_TYPE } from './root';
import KeyboardButton from '../components/keyboard-button';
import DartsUsedRadioButton from '../components/darts-used-radio-button';
import useWakeLock from '../hooks/use-stay-lock';
import BackButton from '../components/back-button';
import { TrashIcon, Undo2Icon } from 'lucide-react';

export async function gameActions({ data, params }) {
	let { gameId } = params;

	let intent = data.intent;
	if (intent === 'add_score') {
		// check if the game exists
		let game = db.find('games', gameId);
		if (game == undefined) throw new NotFoundError('Game not found');

		let gamePlayers = db.select('game_players', { gameId: game.id });
		let players = gamePlayers.map(gp => ({ id: gp.playerId }));

		// get current leg
		let allLegs = db.select('legs', { gameId: game.id });
		let legs = allLegs.slice(-2); // Get the last 2 legs
		let currentLeg = legs[legs.length - 1];
		if (currentLeg == undefined || currentLeg.winnerId != undefined) {
			let newLeg = db.create('legs', { gameId: game.id, createdAt: Date.now() });
			legs.push(newLeg);
		}

		// Add throws to the legs
		for (let leg of legs) {
			let throws = db.select('throws', { legId: leg.id });
			leg.throws = throws;
		}

		let throwerId = getThrowerId(players, legs);

		let leg = legs[legs.length - 1];
		let throwerThrows = leg.throws.filter(t => t.playerId === throwerId);
		let totalScore = throwerThrows.reduce((acc, t) => acc + t.score, 0);

		// add the score to the leg
		let score = parseInt(data.score);
		let darts = parseInt(data.darts);
		if (data.invert === 'true') {
			if (isNaN(score)) throw new BadRequestError('Invalid score');
			// The score that comes in, is the score the player will have after the throw
			score = game.score - totalScore - score;
			if (score < 0) throw new BadRequestError('Invalid score');
		} else if (isNaN(score)) {
			score = 0;
		}

		if (score > 180) throw new BadRequestError('Invalid score');

		const left = game.score - (totalScore + score);

		// check if the score is valid
		if (totalScore + score > game.score) throw new BadRequestError('Invalid score'); // bust

		let isFinish = left === 0;
		if (!isFinish) {
			if (game.checkout === CHECKOUT_TYPE.double && left < 2) {
				throw new BadRequestError('Invalid score'); // bust (double checkout)
			} else if (game.checkout === CHECKOUT_TYPE.triple && left < 3) {
				throw new BadRequestError('Invalid score'); // bust (triple checkout)
			}
		}

		db.create('throws', { legId: leg.id, playerId: throwerId, score, darts, createdAt: Date.now() });

		// check if the leg is over
		if (isFinish) {
			db.update('legs', leg.id, { id: leg.id, gameId: game.id, winnerId: throwerId, createdAt: leg.createdAt });
		}
	} else if (intent === 'undo_score') {
		let game = db.find('games', gameId);
		if (game == undefined) throw new NotFoundError('Game not found');

		let legs = db.select('legs', { gameId: game.id });
		let leg = legs[legs.length - 1];
		if (leg == undefined) throw new Error('No throws to undo');

		let throws = db.select('throws', { legId: leg.id });
		if (throws.length === 0) {
			db.delete('legs', leg.id);
			leg = legs[legs.length - 2];
			throws = db.select('throws', { legId: leg.id });
		}

		let lastThrow = throws.pop();
		if (lastThrow == undefined) throw new Error('No throws to undo');

		db.delete('throws', lastThrow.id);
		if (leg.winnerId != undefined) db.update('legs', leg.id, { ...leg, winnerId: undefined });
	}
}

export async function gameLoader(request) {
	let { gameId } = request.params;

	let game = db.find('games', gameId);
	if (game == undefined) throw new NotFoundError('Game not found');

	let gamePlayers = db.select('game_players', { gameId: game.id });
	let players = [];
	for (let gamePlayer of gamePlayers) {
		let player = db.find('players', gamePlayer.playerId);
		if (player == undefined) continue;

		players.push(player);
	}

	let legs = [];
	let gameLegs = db.select('legs', { gameId: game.id });
	for (let leg of gameLegs) {
		let throws = db.select('throws', { legId: leg.id });
		legs.push({ ...leg, throws });
	}

	// Calculate current thrower
	let throwerId = getThrowerId(players, legs);
	return {
		...game,
		legs,
		players,
		throwerId,
	};
}

export default function Game() {
	let game = useLoaderResult();
	let { throwerId } = game;

	let scoreFormRef = useRef();
	let submitButtonRef = useRef();
	let [AddScoreForm] = useForm();
	let [UndoScoreForm] = useForm();
	let [DeleteGameForm] = useForm();

	let [score, setScore] = useState('');

	useWakeLock();

	useEffect(() => {
		let element = submitButtonRef.current;
		if (element == undefined) return;

		let timeout;
		function track() {
			timeout = setTimeout(() => {
				scoreFormRef.current.invert.value = true;
				submitButtonRef.current.click();
			}, 400);
		}

		function clear() {
			clearTimeout(timeout);
			scoreFormRef.current.invert.value = false;
		}

		element.addEventListener('pointerdown', track);
		element.addEventListener('pointerup', clear);

		return () => {
			element.removeEventListener('pointerdown', track);
			element.removeEventListener('pointerup', clear);
		};
	}, [submitButtonRef]);

	function handleClick(event) {
		let value = event.target.getAttribute('data-value');
		let currentValue = scoreFormRef.current.score.value;

		if (value === 'BUST') {
			setScore('BUST');
			return;
		}

		if (value === 'CLEAR') {
			setScore('');
			return;
		}

		let newValue = currentValue === 'BUST' ? value : `${currentValue}${value}`;
		let parsedNewValue = parseInt(newValue, 10);
		if (parsedNewValue > 180) return;

		setScore(`${parsedNewValue}`);
	}

	return (
		<div className="grid h-full max-h-screen grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center justify-between">
					<span className="flex items-center gap-4">
						<BackButton />
						<span>
							{game.score} {game.checkout} out
						</span>
					</span>

					<DeleteGameForm
						action="/games"
						method="post"
						replace
						className="contents"
						onSubmit={event => {
							const ok = confirm('Are you sure you want to delete this game?');
							if (ok) return;
							event.preventDefault();
						}}
					>
						<input name="gameId" hidden readOnly value={game.id} />
						<button type="submit" name="intent" value="delete_game" className="-m-2 p-2">
							<TrashIcon className="size-7" />
						</button>
					</DeleteGameForm>
				</h1>
			</Header>

			<main className="grid grid-rows-[auto,max-content]">
				<ul className="grid grid-cols-2">
					{game.players.map(player => {
						let playerId = player.id;
						let { legs } = game;

						let playerThrows = legs.flatMap(l => l.throws).filter(t => t.playerId === playerId);
						let leg = game.legs[game.legs.length - 1];

						let legsWon = legs.filter(l => l.winnerId === playerId).length;

						let legAverage = 0;
						let dartsThrown = 0;
						let legTotalScore = 0;
						let lastPlayerScore;
						if (leg != undefined && leg.winnerId == undefined) {
							let legPlayerThrows = leg.throws.filter(t => t.playerId === playerId);
							dartsThrown = legPlayerThrows.reduce((acc, t) => acc + t.darts, 0);
							legTotalScore = legPlayerThrows.reduce((acc, t) => acc + t.score, 0);
							lastPlayerScore = legPlayerThrows[legPlayerThrows.length - 1]?.score;

							legAverage = legPlayerThrows.length === 0 ? 0 : (legTotalScore / legPlayerThrows.length).toFixed(1);
						}

						let remaining = game.score - legTotalScore;
						let checkout = checkouts[remaining];

						let matchTotalScore = playerThrows.reduce((acc, t) => acc + t.score, 0);
						let matchAverage = playerThrows.length === 0 ? 0 : (matchTotalScore / playerThrows.length).toFixed(1);
						return (
							<li
								key={playerId}
								data-thrower={throwerId === playerId}
								className="group grid grid-rows-[max-content,max-content,minmax(min-content,1fr)] text-gray-400 data-[thrower=true]:text-white"
							>
								<div className="flex items-center justify-between gap-1 px-4 py-4 text-lg font-semibold group-even:flex-row-reverse">
									<div className="flex items-center gap-1 truncate group-even:flex-row-reverse">
										<span className="truncate group-even:flex-grow">{player.name}</span>
										<span>({dartsThrown})</span>
										<span className="mx-1 hidden text-sm group-data-[thrower=true]:inline">🎯</span>
									</div>

									<span className="-my-4 bg-violet-500 p-4 text-white group-odd:-mr-4 group-even:-ml-4">{legsWon}</span>
								</div>

								<div className="inline-flex items-center justify-center gap-1 bg-gray-700 py-4 text-gray-400">
									<span>ma: {matchAverage}</span>
									<span>•</span>
									<span>la: {legAverage}</span>
								</div>

								<div className="flex flex-col items-center font-medium self-y-center">
									<div className="text-[5.5rem] leading-none tracking-wider sm:text-8xl">{remaining}</div>
									<div className="mt-3 flex justify-center gap-3 text-[1.75rem] leading-none">
										{checkout?.map((c, i) => (
											<span key={i}>{c}</span>
										))}
									</div>
								</div>

								<div className="text-2xl">
									<div
										data-score={score !== ''}
										className="bg-white p-4 text-center text-gray-400 data-[score=true]:text-gray-800 group-data-[thrower=false]:hidden"
									>
										{score === '' ? 'Enter score' : score}
									</div>

									<UndoScoreForm
										method="post"
										className="flex items-center justify-between gap-2 bg-gray-700 p-4 text-gray-400 group-data-[thrower=true]:hidden"
									>
										<span>Last: {lastPlayerScore ?? 0}</span>
										<button type="submit" name="intent" value="undo_score" className="p-0.5 disabled:text-gray-500">
											<Undo2Icon className="size-7" />
										</button>
									</UndoScoreForm>
								</div>
							</li>
						);
					})}
				</ul>

				<AddScoreForm
					ref={scoreFormRef}
					method="post"
					onNavigate={event => {
						if (score !== '') return;
						event.preventDefault();
					}}
					onNavigateEnd={event => {
						setScore('');
						event.originalEvent.target.reset();
					}}
					onActionError={(event, error) => {
						alert(error.message);
						setScore('');
						event.originalEvent.target.reset();
					}}
				>
					<input name="score" type="text" required hidden readOnly value={score} />
					<input name="invert" type="text" required hidden readOnly defaultValue={false} />

					<div className="grid grid-cols-[repeat(3,minmax(0,1fr)),min-content] gap-px text-center text-3xl">
						<KeyboardButton onClick={handleClick} value="1" />
						<KeyboardButton onClick={handleClick} value="2" />
						<KeyboardButton onClick={handleClick} value="3" />

						<span className="p-4 text-sm text-gray-300">Darts used</span>

						<KeyboardButton onClick={handleClick} value="4" />
						<KeyboardButton onClick={handleClick} value="5" />
						<KeyboardButton onClick={handleClick} value="6" />

						<DartsUsedRadioButton id="1" value={1} />

						<KeyboardButton onClick={handleClick} value="7" />
						<KeyboardButton onClick={handleClick} value="8" />
						<KeyboardButton onClick={handleClick} value="9" />

						<DartsUsedRadioButton id="2" value={2} />

						<button
							onClick={handleClick}
							data-value={score === '' ? 'BUST' : 'CLEAR'}
							type="button"
							className="p-4 data-[value='BUST']:bg-orange-500 data-[value='CLEAR']:bg-red-500"
						>
							{score === '' ? 'BUST' : 'C'}
						</button>

						<KeyboardButton onClick={handleClick} value="0" />

						<button ref={submitButtonRef} type="submit" name="intent" value="add_score" className="bg-green-600 p-4">
							OK
						</button>

						<DartsUsedRadioButton id="3" value={3} defaultChecked />
					</div>
				</AddScoreForm>
			</main>
		</div>
	);
}

function getThrowerId(players, legs) {
	let playerIds = players.map(p => p.id);

	let currentLeg = legs[legs.length - 1];
	if (currentLeg == undefined) return playerIds[0]; // First player to start the game

	let lastThrowerId;
	if (currentLeg.throws.length === 0) {
		// First throw of a new leg so we need to check the starter of the previous leg
		let previousLeg = legs[legs.length - 2];
		if (previousLeg == undefined) return playerIds[0];

		let firstThrowOfTheLeg = previousLeg.throws[0];
		if (firstThrowOfTheLeg == undefined) return playerIds[0];
		lastThrowerId = firstThrowOfTheLeg?.playerId;
	} else if (currentLeg.winnerId != undefined) {
		let firstThrowOfTheLeg = currentLeg.throws[0];
		if (firstThrowOfTheLeg == undefined) return playerIds[0];
		lastThrowerId = firstThrowOfTheLeg?.playerId;
	} else {
		lastThrowerId = currentLeg.throws[currentLeg.throws.length - 1].playerId;
	}

	return playerIds[(playerIds.indexOf(lastThrowerId) + 1) % playerIds.length];
}
