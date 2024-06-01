import React, { useRef, useState } from 'react';
import { Link, useForm, useParams } from 'react-sprout';
import { useFind } from 'key-value-database';

import db from '../database';
import { NotFoundError } from 'http-errors';
import Header from '../components/header';
import PlayerName from '../components/player-name';
import checkouts from '../checkouts';
import { CHECKOUT_TYPE } from './root';
import KeyboardButton from '../components/keyboard-button';
import DartsUsedRadioButton from '../components/darts-used-radio-button';
import UndoIcon from '../components/icons/undo-icon';
import BackIcon from '../components/icons/back-icon';

export async function gameActions({ data, params }) {
	let { gameId } = params;

	let intent = data.intent;
	if (intent === 'add_score') {
		// check if the game exists
		let game = db.find('games', gameId);
		if (game == undefined) throw new NotFoundError('Game not found');

		// get current leg
		let leg = game.legs[game.legs.length - 1];
		if (leg == undefined || leg.winnerId != undefined) {
			game.legs.push({ winnerId: null, throws: [] });
			leg = game.legs[game.legs.length - 1];
		}

		let throwerId = getThrowerId(game);

		// add the score to the leg
		let score = parseInt(data.score);
		let darts = parseInt(data.darts);

		let throwerThrows = leg.throws.filter((t) => t.playerId === throwerId);
		let totalScore = throwerThrows.reduce((acc, t) => acc + t.score, 0);

		// check if the score is valid
		if (totalScore + score > game.score) throw new Error('Score exceeds the game score'); // bust
		if (game.checkout === CHECKOUT_TYPE.double && score === game.score - 1) {
			throw new Error('Score exceeds the game score'); // bust (double checkout)
		}
		if (game.checkout === CHECKOUT_TYPE.triple && score === game.score - 2) {
			throw new Error('Score exceeds the game score'); // bust (triple checkout)
		}

		let isFinish = totalScore + score === game.score;
		if (isFinish) {
			// TODO: add checks for double and triple checkout
			// double -> score % 2 === 0 must be throw with at least 2 darts
		}

		leg.throws.push({ playerId: throwerId, score, darts });

		// check if the leg is over
		if (isFinish) leg.winnerId = throwerId;

		// update the game
		db.update('games', game.id, game);
	} else if (intent === 'undo_score') {
		let game = db.find('games', gameId);
		if (game == undefined) throw new NotFoundError('Game not found');

		let leg = game.legs[game.legs.length - 1];
		if (leg == undefined || leg.winnerId != undefined) throw new Error('No throws to undo');

		let lastThrow = leg.throws.pop();
		if (lastThrow == undefined) throw new Error('No throws to undo');

		db.update('games', game.id, game);
	}
}

const DateTimeFormat = new Intl.DateTimeFormat('nl-BE', {
	day: 'numeric',
	year: 'numeric',
	month: '2-digit',
	hour: 'numeric',
	minute: 'numeric',
});

export default function Game() {
	let { gameId } = useParams();
	let game = useFind(db, 'games', gameId);
	if (game == undefined) throw new NotFoundError('Game not found');

	let throwerId = getThrowerId(game);

	let scoreFormRef = useRef();
	let [AddScoreForm] = useForm();
	let [UndoScoreForm] = useForm();
	let [score, setScore] = useState('');

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

		let newValue = `${currentValue}${value}`;
		let parsedNewValue = parseInt(newValue, 10);
		if (parsedNewValue > 180) return;

		setScore(`${parsedNewValue}`);
	}

	return (
		<div className="grid grid-rows-[max-content,auto] h-full">
			<Header>
				<h1 className="flex items-center justify-between">
					<span className="flex items-center gap-4">
						<Link href=".." push={false}>
							<BackIcon className="size-7" />
						</Link>
						<span>
							{game.score} {game.checkout} out
						</span>
					</span>
					<span className="text-sm font-light text-blue-100">{DateTimeFormat.format(new Date(game.startedAt))}</span>
				</h1>
			</Header>

			<main className="grid grid-rows-[auto,max-content]">
				<ul className="grid grid-cols-2">
					{game.playerIds.map((playerId) => {
						let legs = game.legs ?? [];
						let playerThrows = legs.flatMap((l) => l.throws).filter((t) => t.playerId === playerId);
						let leg = game.legs[game.legs.length - 1];

						let legsWon = legs.filter((l) => l.winnerId === playerId).length;

						let legAverage = 0;
						let dartsThrown = 0;
						let legTotalScore = 0;
						let lastPlayerScore;
						if (leg != undefined && leg.winnerId == undefined) {
							let legPlayerThrows = leg.throws.filter((t) => t.playerId === playerId);
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
								<div className="px-4 py-4 font-semibold text-lg flex gap-1 items-center justify-between group-even:flex-row-reverse">
									<div className="group-even:flex-row-reverse truncate flex items-center gap-1">
										<span className="group-even:flex-grow truncate">
											<PlayerName id={playerId} />
										</span>
										<span>({dartsThrown})</span>
										<span className="group-data-[thrower=true]:inline hidden mx-1">🎯</span>
									</div>

									<span className="bg-violet-500 p-4 -my-4 group-odd:-mr-4 group-even:-ml-4 text-white">{legsWon}</span>
								</div>

								<div className="py-4 bg-gray-700 justify-center inline-flex gap-1 items-center">
									<span>ma: {matchAverage}</span>
									<span>•</span>
									<span>la: {legAverage}</span>
								</div>

								<div className="flex flex-col items-center self-y-center">
									<div className="font-medium text-[5.5rem] leading-none sm:text-8xl">{remaining}</div>
									<div className="gap-3 justify-center font-light mt-3 text-[1.75rem] leading-none flex">
										{checkout?.map((c, i) => (
											<span key={i}>{c}</span>
										))}
									</div>
								</div>

								<div className="text-2xl">
									<div
										data-score={score !== ''}
										className="p-4 data-[score=true]:text-gray-800 bg-white text-gray-400 group-data-[thrower=false]:hidden"
									>
										{score === '' ? 'Enter score' : score}
									</div>

									<UndoScoreForm
										method="post"
										className="group-data-[thrower=true]:hidden flex justify-between text-gray-400 items-center gap-2 bg-gray-700 p-4"
									>
										<span>Last: {lastPlayerScore ?? 0}</span>
										<button
											type="submit"
											name="intent"
											disabled={lastPlayerScore == undefined}
											value="undo_score"
											className="p-0.5 disabled:text-gray-500"
										>
											<UndoIcon className="size-7" />
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
					onNavigateEnd={() => {
						setScore('');
						scoreFormRef.current.reset();
					}}
				>
					<input name="score" type="text" required hidden readOnly value={score} />

					<div className="grid grid-cols-[repeat(3,minmax(0,1fr)),min-content] gap-px text-center text-3xl">
						<KeyboardButton onClick={handleClick} value="7" />
						<KeyboardButton onClick={handleClick} value="8" />
						<KeyboardButton onClick={handleClick} value="9" />

						<span className="text-sm p-4 text-gray-300">Darts used</span>

						<KeyboardButton onClick={handleClick} value="4" />
						<KeyboardButton onClick={handleClick} value="5" />
						<KeyboardButton onClick={handleClick} value="6" />

						<DartsUsedRadioButton id="1" value={1} />

						<KeyboardButton onClick={handleClick} value="1" />
						<KeyboardButton onClick={handleClick} value="2" />
						<KeyboardButton onClick={handleClick} value="3" />

						<DartsUsedRadioButton id="2" value={2} />

						<button
							onClick={handleClick}
							data-value={score === '' ? 'BUST' : 'CLEAR'}
							type="button"
							className="p-4 data-[value='CLEAR']:bg-red-500 data-[value='BUST']:bg-orange-500 data-[value='CLEAR']:active:bg-red-400 data-[value='BUST']:active:bg-orange-400"
						>
							{score === '' ? 'BUST' : 'C'}
						</button>

						<KeyboardButton onClick={handleClick} value="0" />

						<button type="submit" name="intent" value="add_score" className="p-4 bg-green-600">
							OK
						</button>

						<DartsUsedRadioButton id="3" value={3} />
					</div>
				</AddScoreForm>
			</main>
		</div>
	);
}

function getThrowerId(game) {
	let playerIds = game.playerIds;

	let currentLeg = game.legs[game.legs.length - 1];
	if (currentLeg == undefined) return playerIds[0]; // First player to start the game

	let lastThrowerId;
	if (currentLeg.throws.length === 0) {
		// First throw of a new leg so we need to check the starter of the previous leg
		let previousLeg = game.legs[game.legs.length - 2];
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
