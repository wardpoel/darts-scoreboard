import React, { useRef, useState } from 'react';
import { useForm, useParams } from 'react-sprout';
import { useFind } from 'key-value-database';

import db from '../database';
import { NotFoundError } from 'http-errors';
import Header from '../components/header';
import PlayerName from '../components/player-name';

const INPUTS = [7, 8, 9, 4, 5, 6, 1, 2, 3];

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

		let lastThrow = leg.throws[leg.throws.length - 1];
		let lastThrowerId = lastThrow?.playerId;

		let playerIds = game.playerIds;
		let throwerId;
		if (lastThrowerId == undefined) {
			throwerId = playerIds[0];
		} else {
			throwerId = playerIds[(playerIds.indexOf(lastThrowerId) + 1) % playerIds.length];
		}

		// add the score to the leg
		let score = parseInt(data.score);
		let darts = parseInt(data.darts);

		let throwerThrows = leg.throws.filter((t) => t.playerId === throwerId);
		let totalScore = throwerThrows.reduce((acc, t) => acc + t.score, 0);

		// check if the score is valid
		if (totalScore + score > game.score) throw new Error('Score exceeds the game score'); // bust
		if (game.checkout === 'DOUBLE' && score === game.score - 1) throw new Error('Score exceeds the game score'); // bust (double checkout)
		if (game.checkout === 'TRIPLE' && score === game.score - 2) throw new Error('Score exceeds the game score'); // bust (triple checkout)

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
	}
}

export default function Game() {
	let { gameId } = useParams();
	let game = useFind(db, 'games', gameId);
	if (game == undefined) throw new NotFoundError('Game not found');

	let playerLegWins = {};
	for (let leg of game.legs) {
		if (leg.winnerId == undefined) continue;
		let current = playerLegWins[leg.winnerId] ?? 0;
		playerLegWins[leg.winnerId] = current + 1;
	}

	return (
		<div>
			<Header>
				<h1>Game - {new Date(game.startedAt).toDateString()}</h1>
			</Header>

			<main>
				<GamePlayers game={game} />
				<CurrentScores game={game} />

				<InputForm />
			</main>
		</div>
	);
}

function GamePlayers(props) {
	let { game } = props;
	let throwerId = useThrowerId(game);

	return (
		<ul className="grid grid-cols-2 -mx-4 bg-gray-700 text-white">
			{game.playerIds.map((playerId) => {
				let leg = game.legs[game.legs.length - 1];
				let playerThrows = [];
				if (leg != undefined && leg.winnerId == undefined) {
					playerThrows = leg.throws.filter((t) => t.playerId === playerId);
				}

				let dartsThrown = playerThrows.reduce((acc, t) => acc + t.darts, 0);
				return (
					<li
						key={playerId}
						data-thrower={throwerId === playerId}
						className="px-4 group py-4 font-semibold text-lg flex gap-1 even:flex-row-reverse"
					>
						<PlayerName id={playerId} />
						<span>({dartsThrown})</span>
						<span className="hidden group-data-[thrower=true]:block group-even:mr-2">🎯</span>
					</li>
				);
			})}
		</ul>
	);
}

function InputForm() {
	let scoreFormRef = useRef();
	let [AddScoreForm] = useForm();
	let [score, setScore] = useState('0');
	let [isBusted, setIsBusted] = useState(false);

	function handleClick(event) {
		let value = event.target.getAttribute('data-value');
		let currentValue = scoreFormRef.current.score.value;

		if (value === 'BUST') {
			setIsBusted(true);
			return;
		}

		if (value === 'CLEAR') {
			setScore('0');
			setIsBusted(false);
			return;
		}

		let newValue = `${currentValue}${value}`;
		let parsedNewValue = parseInt(newValue, 10);
		if (parsedNewValue > 180) {
			// todo show error
			return;
		}

		setScore(`${parsedNewValue}`);
	}

	return (
		<AddScoreForm
			id="add_score_form"
			ref={scoreFormRef}
			action="."
			method="post"
			onNavigateEnd={() => {
				setScore('0');
				scoreFormRef.current.reset();
			}}
		>
			<div>{isBusted ? 'BUST' : score}</div>
			<input name="score" type="text" required placeholder="Score" hidden readOnly value={score} />

			<div className="grid grid-cols-3">
				{INPUTS.map((input) => (
					<button key={input} onClick={handleClick} data-value={input} type="button">
						{input}
					</button>
				))}

				<button onClick={handleClick} data-value={isBusted || score !== '0' ? 'CLEAR' : 'BUST'} type="button">
					{isBusted || score !== '0' ? 'C' : 'BUST'}
				</button>

				<button onClick={handleClick} data-value="0" type="button">
					0
				</button>

				<button type="submit" name="intent" value="add_score">
					OK
				</button>
			</div>

			<div>
				<input type="radio" id="1" name="darts" value={1} />
				<label htmlFor="1">1</label>
			</div>
			<div>
				<input type="radio" id="2" name="darts" value={2} />
				<label htmlFor="2">2</label>
			</div>
			<div>
				<input type="radio" id="3" name="darts" value={3} defaultChecked />
				<label htmlFor="3">3</label>
			</div>
		</AddScoreForm>
	);
}

function CurrentScores(props) {
	let { game } = props;

	return (
		<div>
			{game.playerIds.map((playerId) => (
				<CurrentPlayerScore key={playerId} game={game} playerId={playerId} />
			))}
		</div>
	);
}

function CurrentPlayerScore(props) {
	let { game, playerId } = props;

	let leg = game.legs[game.legs.length - 1];
	if (leg == undefined || leg.winnerId != undefined) return game.score;

	let playerThrows = leg.throws.filter((t) => t.playerId === playerId);
	let throwed = playerThrows.reduce((acc, t) => acc + t.score, 0);

	let remaining = game.score - throwed;

	return <span>{remaining}</span>;
}

function useThrowerId(game) {
	let leg = game.legs[game.legs.length - 1];
	if (leg == undefined || leg.winnerId != undefined) return game.playerIds[0];

	let lastThrow = leg.throws[leg.throws.length - 1];
	let lastThrowerId = lastThrow?.playerId;

	let playerIds = game.playerIds;
	let throwerId;
	if (lastThrowerId == undefined) {
		throwerId = playerIds[0];
	} else {
		throwerId = playerIds[(playerIds.indexOf(lastThrowerId) + 1) % playerIds.length];
	}

	return throwerId;
}
