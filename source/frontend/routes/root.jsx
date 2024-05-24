import db from '../database';

const GAME_TYPES = {
	101: '101',
	170: '170',
	301: '301',
	501: '501',
};

const CHECKOUT_TYPES = {
	single: 'SINGLE',
	double: 'DOUBLE',
	triple: 'TRIPLE',
};

export async function rootActions({ data }) {
	let intent = data.intent;

	if (intent === 'start_game') {
		let totalPlayers = db.count('players');
		if (totalPlayers < 2) throw new Error('Not enough players to start the game');

		let { players } = data;
		if (players.length < 2) throw new Error('Select atleast two players to start a game');

		let game = db.create('games', { players, type: GAME_TYPES[170], checkout: CHECKOUT_TYPES.double });

		return Response.redirect(`/games/${game.id}`, 303);
	}
}

export default function Root(props) {
	return props.children;
}
