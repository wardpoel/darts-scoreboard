import React from 'react';
import db from '../database';
import { NotFoundError } from 'http-errors';
import { Link, useLoaderResult, useParams } from 'react-sprout';
import { DateFormat } from '../utils/date-time';

export async function playerGamesLoader(request) {
	let { params, url } = request;
	let score = url.searchParams.get('score') ?? 'all';
	let checkout = url.searchParams.get('checkout') ?? 'all';

	let player = db.selectById('players', params.playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	let playerGames = db.select('game_players', { playerId: player.id });

	let games = [];
	for (let gamePlayer of playerGames) {
		let game = db.selectById('games', gamePlayer.gameId);
		if (game == undefined) continue;

		if (score !== 'all' && checkout === 'all') {
			if (game.score.toString() !== score) continue;
		} else if (score === 'all' && checkout !== 'all') {
			if (game.checkout.toLowerCase() !== checkout.toLowerCase()) continue;
		} else if (score !== 'all' && checkout !== 'all') {
			if (game.score.toString() !== score || game.checkout.toLowerCase() !== checkout.toLowerCase()) continue;
		}

		let gamePlayers = db.select('game_players', { gameId: game.id });

		let players = [];
		for (let gamePlayer of gamePlayers) {
			let player = db.selectById('players', gamePlayer.playerId);
			if (player == undefined) continue;

			players.push(player);
		}

		game.players = players;

		// Get score for each game
		let legs = db.select('legs', { gameId: game.id });
		let scores = {};
		for (let player of players) {
			scores[player.id] = 0;
		}

		for (let leg of legs) {
			if (leg.winnerId == undefined) continue;
			scores[leg.winnerId] = scores[leg.winnerId] + 1;
		}

		game.scores = scores;

		games.push(game);
	}

	return { games: games.sort((a, b) => b.createdAt - a.createdAt) };
}

export default function PlayerGames() {
	let { games } = useLoaderResult();

	if (games.length === 0) return <p className="px-4 text-gray-400">No games played yet</p>;
	return (
		<ul className="py-1">
			{games.map(game => (
				<PlayerGameListItem key={game.id} game={game} />
			))}
		</ul>
	);
}

function PlayerGameListItem(props) {
	let { game } = props;
	let { playerId } = useParams();

	let result;
	let playerScore = game.scores[playerId];
	let minScore = Math.min(...Object.values(game.scores));
	let maxScore = Math.max(...Object.values(game.scores));

	// Minscore is used for tiebreakers
	if (playerScore === maxScore && minScore !== maxScore) {
		result = 'won';
	} else if (playerScore === minScore && minScore !== maxScore) {
		result = 'loss';
	} else if (minScore === maxScore) {
		result = 'draw';
	}

	return (
		<li>
			<Link href={`/games/${game.id}`} className="flex items-center justify-between px-4 py-3 active:bg-gray-700" cache>
				<div className="flex flex-col leading-tight">
					<div className="flex items-baseline gap-2">
						<span className="text-lg font-medium">
							{game.score} {game.checkout} out
						</span>
						<span className="text-xs font-light text-gray-400">{DateFormat.format(new Date(game.createdAt))}</span>
					</div>
					<span className="font-light text-gray-400">{game.players.map(p => p.name).join(' - ')}</span>
				</div>
				<div className="flex gap-2">
					{Object.entries(game.scores).map(([playerId, score]) => (
						<span
							key={playerId}
							data-result={result}
							className="inline-flex size-8 items-center justify-center rounded-full proportional-nums data-[result='draw']:bg-gray-500 data-[result='loss']:bg-red-500 data-[result='won']:bg-green-500"
						>
							{score}
						</span>
					))}
				</div>
			</Link>
		</li>
	);
}
