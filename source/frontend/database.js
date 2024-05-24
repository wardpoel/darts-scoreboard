import Database from 'key-value-database';

const db = new Database(localStorage, {
	prefix: 'ds-',
	migrations: [
		function (db) {
			db.addTable('players');
			db.addTable('games');
		},
	],
});

export default db;
