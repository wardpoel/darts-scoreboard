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
	],
});

export default db;
