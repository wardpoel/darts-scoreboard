import Database from 'key-value-database';

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
		// function (db) {
		// 	let games = db.select('games');
		// 	for (let game of games) {
		// 		game.checkout = game.checkout.toLowerCase();
		// 		db.update('games', game.id, game);
		// 	}
		// },
		// function (db) {
		// 	const DEFAULT_STAT = {
		// 		legs: { wins: 0, losses: 0, played: 0 },
		// 		games: { wins: 0, losses: 0, played: 0 },
		// 		total: 0,
		// 		darts: 0,
		// 	};

		// 	db.addTable('stats');

		// 	let players = db.select('players');
		// 	for (let player of players) {
		// 		let stats = {
		// 			101: { single: { ...DEFAULT_STAT }, double: { ...DEFAULT_STAT }, triple: { ...DEFAULT_STAT } },
		// 			170: { single: { ...DEFAULT_STAT }, double: { ...DEFAULT_STAT }, triple: { ...DEFAULT_STAT } },
		// 			301: { single: { ...DEFAULT_STAT }, double: { ...DEFAULT_STAT }, triple: { ...DEFAULT_STAT } },
		// 			501: { single: { ...DEFAULT_STAT }, double: { ...DEFAULT_STAT }, triple: { ...DEFAULT_STAT } },
		// 		};

		// 		let playerGames = db.select('game_players', { playerId: player.id });
		// 		for (let playerGame of playerGames) {
		// 			let game = db.selectById('games', playerGame.gameId);
		// 			if (game == undefined) continue;

		// 			let gameLegs = db.select('legs', { gameId: game.id });
		// 			let gameLegWins = gameLegs.filter(leg => leg.winnerId === player.id).length;
		// 			let gameLegLosses = gameLegs.filter(leg => leg.winnerId != undefined && leg.winnerId !== player.id).length;

		// 			let win = gameLegWins > gameLegLosses;
		// 			let loss = gameLegWins < gameLegLosses;

		// 			let totalScore = 0;
		// 			let totalDarts = 0;
		// 			for (let leg of gameLegs) {
		// 				let throws = db.select('throws', { legId: leg.id, playerId: player.id });
		// 				let { score, darts } = throws.reduce(
		// 					(total, t) => ({ score: total.score + t.score, darts: total.darts + t.darts }),
		// 					{ score: 0, darts: 0 },
		// 				);

		// 				totalScore += score;
		// 				totalDarts += darts;
		// 			}

		// 			let current = stats[game.score][game.checkout];
		// 			stats[game.score][game.checkout] = {
		// 				legs: {
		// 					wins: current.legs.wins + gameLegWins,
		// 					losses: current.legs.wins + gameLegLosses,
		// 					played: current.legs.played + gameLegs.length,
		// 				},
		// 				games: {
		// 					wins: win ? current.games.wins + 1 : current.games.wins,
		// 					losses: loss ? current.games.losses + 1 : current.games.losses,
		// 					played: current.games.played + 1,
		// 				},
		// 				total: current.total + totalScore,
		// 				darts: current.darts + totalDarts,
		// 			};
		// 		}

		// 		let stat = db.create('stats', { ...stats, createdAt: Date.now(), updatedAt: Date.now() });
		// 		if (stat != undefined) {
		// 			db.update('players', player.id, { ...player, statId: stat.id });
		// 		}
		// 	}
		// },
	],
});

export default db;
