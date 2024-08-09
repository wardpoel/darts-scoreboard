/// <reference path="../typedefs.js" />

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
import { SCORE_PRESETS } from './new';

/**
 *
 * @param {string} playerId
 * @returns
 */
function createStat(playerId) {
	let player = db.selectById('players', playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	let stat = {};
	for (let score of SCORE_PRESETS) {
		stat[score] = {};
		for (let checkout of Object.values(CHECKOUT_TYPE)) {
			stat[score][checkout] = {
				legs: { wins: 0, losses: 0, played: 0 },
				games: { wins: 0, losses: 0, played: 0 },
				total: 0,
				darts: 0,
			};
		}
	}

	let created = db.create('stats', stat);
	db.update('players', player.id, { ...player, statId: created.id });

	return created;
}

/**
 *
 * @param {string} playerId
 * @param {Array<Leg>} legs
 * @returns {PlayerGameState}
 */
function getPlayerGameState(playerId, legs) {
	let wins = 0;
	let losses = 0;
	for (let leg of legs) {
		if (leg.winnerId == undefined) continue;
		if (leg.winnerId === playerId) {
			wins += 1;
		} else {
			losses += 1;
		}
	}

	if (wins > losses) return 'win';
	if (wins < losses) return 'loss';
	return 'draw';
}

export async function gameActions({ data, params }) {
	let { gameId } = params;

	// check if the game exists
	let game = db.selectById('games', gameId);
	if (game == undefined) throw new NotFoundError('Game not found');

	let gamePlayers = db.select('game_players', { gameId: game.id });
	let players = gamePlayers.map(gp => {
		let player = db.selectById('players', gp.playerId);
		if (player == undefined) throw new NotFoundError('Player not found');
		return player;
	});

	let intent = data.intent;
	if (intent === 'add_score') {
		// get current leg
		let legs = db.select('legs', { gameId: game.id });
		let currentLeg = legs[legs.length - 1];
		if (currentLeg == undefined || currentLeg.winnerId != undefined) {
			let newLeg = db.create('legs', { gameId: game.id, createdAt: Date.now() });
			legs.push(newLeg);
		}

		// Add throws to the legs
		for (let leg of legs) {
			leg.throws = db.select('throws', { legId: leg.id });
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

		let isFirstThrowOfLeg = leg.throws.length === 0;
		let isFirstThrowOfGame = legs.length === 1 && isFirstThrowOfLeg;

		// check if the leg is over
		if (isFinish) {
			leg.winnerId = throwerId;
			db.update('legs', leg.id, { ...leg, throws: undefined });
		}

		// Update stats for every player
		for (let player of players) {
			let isThrower = player.id === throwerId;
			// Update stats when:
			// player is the thrower
			// or when it's the first throw of the leg
			// or when it's the first throw of the game
			// or when it's a finish
			if (!isThrower && !isFirstThrowOfLeg && !isFirstThrowOfGame && !isFinish) continue;

			let stat = player.statId == undefined ? createStat(player.id) : db.selectById('stats', player.statId);
			let current = stat[game.score][game.checkout];

			// Update total score and darts thrown
			if (isThrower) {
				current.total += score;
				current.darts += darts;
			}

			// Update leg stats
			if (isFirstThrowOfLeg) current.legs.played += 1;
			if (isFinish && isThrower) current.legs.wins += 1;
			if (isFinish && !isThrower) current.legs.losses += 1;

			// Update game stats
			if (isFirstThrowOfGame) current.games.played += 1;
			if (isFinish) {
				// Also calculate the previous winning/losing for the player
				let prevState = getPlayerGameState(player.id, legs.slice(0, -1));
				let newState = getPlayerGameState(player.id, legs);
				if (prevState !== newState) {
					if (prevState === 'draw' && newState === 'win') {
						current.games.wins += 1;
					} else if (prevState === 'draw' && newState === 'loss') {
						current.games.losses += 1;
					} else if (prevState === 'win' && newState === 'draw') {
						current.games.wins -= 1;
					} else if (prevState === 'loss' && newState === 'draw') {
						current.games.losses -= 1;
					}
				}
			}

			// Update the stats
			db.update('stats', stat.id, { ...stat });
		}
	} else if (intent === 'undo_score') {
		let legs = db.select('legs', { gameId: game.id });
		let leg = legs[legs.length - 1];
		if (leg == undefined) throw new Error('No throws to undo');

		let throws = db.select('throws', { legId: leg.id });

		let isWinner = leg.winnerId != undefined;
		let isFirstThrowOfLeg = throws.length === 1;

		let lastThrow = throws.pop();
		if (lastThrow == undefined) throw new Error('No throws to undo');

		db.delete('throws', lastThrow.id);

		// Delete the leg if it's the last throw of the leg
		if (isFirstThrowOfLeg) {
			db.delete('legs', leg.id);
		} else if (isWinner) {
			// Update the winner of the leg
			db.update('legs', leg.id, { ...leg, winnerId: undefined });
		}

		// Update stats for every player
		for (let player of players) {
			// Update stats when:
			// player is the thrower
			// or when the leg has a winner
			// or when it's the last throw of the leg
			if (!isFirstThrowOfLeg && !isWinner && lastThrow.playerId !== player.id) continue;

			let stat = player.statId == undefined ? createStat(player.id) : db.selectById('stats', player.statId);
			let current = stat[game.score][game.checkout];

			// Global stats
			if (isFirstThrowOfLeg) current.legs.played -= 1; // Remove leg from the played legs when first throw of leg
			if (isFirstThrowOfLeg && legs.length === 1) current.games.played -= 1; // Remove game from the played games when first throw of game

			// Player was the thrower
			if (player.id === lastThrow.playerId) {
				current.total -= lastThrow.score;
				current.darts -= lastThrow.darts;
			}

			// Update leg stats
			if (leg.winnerId != undefined) {
				// Remove the win/loss
				if (leg.winnerId === player.id) current.legs.wins -= 1;
				if (leg.winnerId !== player.id) current.legs.losses -= 1;
			}

			// Update game stats
			let prevState = getPlayerGameState(player.id, legs);
			let newState = getPlayerGameState(
				player.id,
				legs.filter(l => l.id !== leg.id),
			);
			if (prevState !== newState) {
				if (prevState === 'draw' && newState === 'win') {
					current.games.wins += 1;
				} else if (prevState === 'draw' && newState === 'loss') {
					current.games.losses += 1;
				} else if (prevState === 'win' && newState === 'draw') {
					current.games.wins -= 1;
				} else if (prevState === 'loss' && newState === 'draw') {
					current.games.losses -= 1;
				}
			}

			// Update the stats	item
			db.update('stats', stat.id, { ...stat });
		}
	}
}

export async function gameLoader(request) {
	let { gameId } = request.params;

	let game = db.selectById('games', gameId);
	if (game == undefined) throw new NotFoundError('Game not found');

	let gamePlayers = db.select('game_players', { gameId: game.id });
	let players = [];
	for (let gamePlayer of gamePlayers) {
		let player = db.selectById('players', gamePlayer.playerId);
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

	let lastScore = 0;
	let leg = game.legs[game.legs.length - 1];
	if (leg != undefined && leg.winnerId == undefined) {
		let lastThrow = leg.throws[leg.throws.length - 1];
		if (lastThrow != undefined) lastScore = lastThrow.score;
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

			<main className="grid grid-rows-[auto,max-content,max-content]">
				{game.players.length === 2 ? (
					<ul className="grid grid-cols-2">
						{game.players.map(player => {
							let playerId = player.id;
							let { legAverage, legDartsThrown, legsWon, matchAverage, remaining } = calculate(game, playerId);
							let checkout = checkouts[remaining];

							return (
								<li
									key={playerId}
									data-thrower={throwerId === playerId}
									className="group grid grid-rows-[max-content,max-content,minmax(min-content,1fr)] text-gray-400 data-[thrower=true]:text-white"
								>
									<div className="flex items-center justify-between gap-1 p-4 text-lg font-semibold group-even:flex-row-reverse">
										<div className="flex items-center gap-1 truncate group-even:flex-row-reverse">
											<span className="truncate group-even:flex-grow">{player.name}</span>
											<span>({legDartsThrown})</span>
											<span className="mx-1 hidden text-sm group-data-[thrower=true]:inline">🎯</span>
										</div>

										<span className="-my-4 bg-violet-500 p-4 text-white group-odd:-mr-4 group-even:-ml-4">
											{legsWon}
										</span>
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
											<span>Last: {lastScore}</span>
											<button type="submit" name="intent" value="undo_score" className="p-0.5 disabled:text-gray-500">
												<Undo2Icon className="size-7" />
											</button>
										</UndoScoreForm>
									</div>
								</li>
							);
						})}
					</ul>
				) : null}

				{game.players.length > 2 ? (
					<div className="px-4">
						<ul className="flex flex-col items-y-start">
							{game.players.map(player => {
								let playerId = player.id;
								let { legDartsThrown, legsWon, remaining } = calculate(game, playerId);

								return (
									<li key={playerId} data-thrower={throwerId === playerId} className="group w-full">
										<div className="grid grid-cols-[auto,repeat(2,max-content)] text-lg font-semibold proportional-nums">
											<div className="flex items-center gap-1 truncate">
												<span className="truncate group-even:flex-grow">{player.name}</span>
												<span>({legDartsThrown})</span>
												<span className="mx-1 hidden text-sm group-data-[thrower=true]:inline">🎯</span>
											</div>

											<span className="bg-violet-500 p-4 text-white">{legsWon}</span>
											<span>{remaining}</span>
										</div>
									</li>
								);
							})}
						</ul>

						<div className="grid grid-cols-2 text-2xl">
							<div
								data-score={score !== ''}
								className="bg-white p-4 text-center text-gray-400 data-[score=true]:text-gray-800"
							>
								{score === '' ? 'Enter score' : score}
							</div>

							<UndoScoreForm
								method="post"
								className="flex items-center justify-between gap-2 bg-gray-700 p-4 text-gray-400"
							>
								<span>Last: {lastScore}</span>
								<button type="submit" name="intent" value="undo_score" className="p-0.5 disabled:text-gray-500">
									<Undo2Icon className="size-7" />
								</button>
							</UndoScoreForm>
						</div>
					</div>
				) : null}

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

function calculate(game, playerId) {
	let { legs } = game;

	let playerThrows = legs.flatMap(l => l.throws).filter(t => t.playerId === playerId);
	let leg = game.legs[game.legs.length - 1];

	let legsWon = legs.filter(l => l.winnerId === playerId).length;

	let legAverage = 0;
	let legDartsThrown = 0;
	let legTotalScore = 0;
	if (leg != undefined && leg.winnerId == undefined) {
		let legPlayerThrows = leg.throws.filter(t => t.playerId === playerId);
		legTotalScore = legPlayerThrows.reduce((acc, t) => acc + t.score, 0);
		legDartsThrown = legPlayerThrows.reduce((acc, t) => acc + t.darts, 0);

		legAverage = legPlayerThrows.length === 0 ? 0 : (legTotalScore / (legDartsThrown / 3)).toFixed(1);
	}

	let remaining = game.score - legTotalScore;

	let matchTotalScore = playerThrows.reduce((acc, t) => acc + t.score, 0);
	let matchDarstThrown = playerThrows.reduce((acc, t) => acc + t.darts, 0);
	let matchAverage = playerThrows.length === 0 ? 0 : (matchTotalScore / (matchDarstThrown / 3)).toFixed(1);

	return { legAverage, legDartsThrown, legsWon, remaining, matchAverage };
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
