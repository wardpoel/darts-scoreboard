import Database from 'key-value-database';
import { CHECKOUT_TYPE } from './routes/root';
import { SCORE_PRESETS } from './routes/new';

const db = new Database(localStorage, {
	prefix: 'ds-',
	migrations: [
		function (db) {
			db.addTable('games');
			db.addTable('players');
			db.addTable('game_players');
			db.addTable('legs');
			db.addTable('throws');

			// Add indexes
			db.addIndex('game_players', 'gameId');
			db.addIndex('game_players', 'playerId');
			db.addIndex('legs', 'gameId');
			db.addIndex('throws', 'legId');
			db.addIndex('throws', 'playerId');
		},
		function (db) {
			let games = db.select('games');
			for (let game of games) {
				game.checkout = game.checkout.toLowerCase();
				db.update('games', game.id, game);
			}
		},
		function (db) {
			db.addTable('stats');

			let players = db.select('players');
			for (let player of players) {
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

				let playerGames = db.select('game_players', { playerId: player.id });
				for (let playerGame of playerGames) {
					let game = db.selectById('games', playerGame.gameId);
					if (game == undefined) continue;

					let gameLegs = db.select('legs', { gameId: game.id });
					let gameLegWins = gameLegs.filter(leg => leg.winnerId === player.id).length;
					let gameLegLosses = gameLegs.filter(leg => leg.winnerId != undefined && leg.winnerId !== player.id).length;

					let win = gameLegWins > gameLegLosses;
					let loss = gameLegWins < gameLegLosses;

					let totalScore = 0;
					let totalDarts = 0;
					for (let leg of gameLegs) {
						let throws = db.select('throws', { legId: leg.id, playerId: player.id });
						let { score, darts } = throws.reduce(
							(total, t) => ({ score: total.score + t.score, darts: total.darts + t.darts }),
							{ score: 0, darts: 0 },
						);

						totalScore += score;
						totalDarts += darts;
					}

					let current = stat[game.score][game.checkout];
					stat[game.score][game.checkout] = {
						legs: {
							wins: current.legs.wins + gameLegWins,
							losses: current.legs.wins + gameLegLosses,
							played: current.legs.played + gameLegs.length,
						},
						games: {
							wins: win ? current.games.wins + 1 : current.games.wins,
							losses: loss ? current.games.losses + 1 : current.games.losses,
							played: current.games.played + 1,
						},
						total: current.total + totalScore,
						darts: current.darts + totalDarts,
					};
				}

				let createdStat = db.create('stats', { ...stat, createdAt: Date.now(), updatedAt: Date.now() });
				if (createdStat != undefined) {
					db.update('players', player.id, { ...player, statId: createdStat.id });
				}
			}
		},
		function (db) {
			let legs = db.select('legs');
			for (let leg of legs) {
				db.update('legs', leg.id, { ...leg, throws: undefined });
			}
		},
		function (db) {
			db.loadSchema({
				tables: [
					{ name: 'games' },
					{ name: 'players' },
					{
						name: 'game_players',
						indexes: [{ attributes: [['gameId', 'o => o.gameId']] }, { attributes: [['playerId', 'o => o.playerId']] }],
					},
					{ name: 'legs', indexes: [{ attributes: [['gameId', 'o => o.gameId']] }] },
					{
						name: 'throws',
						indexes: [{ attributes: [['legId', 'o => o.legId']] }, { attributes: [['playerId', 'o => o.playerId']] }],
					},
					{ name: 'stats' },
				],
			});
		},
		// function (db) {
		// 	let players = db.select('players');
		// 	for (let player of players) {
		// 		let playerGames = db.select('game_players', { playerId: player.id });
		// 		let legWins = [];
		// 		for (let playerGame of playerGames) {
		// 			let game = db.selectById('games', playerGame.gameId);
		// 			if (game == undefined) continue;

		// 			let gameLegs = db.select('legs', { gameId: game.id });
		// 			let gameLegWins = gameLegs.filter(leg => leg.winnerId === player.id);

		// 			legWins.push(...gameLegWins);
		// 		}

		// 		console.log(player.id, legWins);
		// 	}
		// },
	],
});

export default db;
