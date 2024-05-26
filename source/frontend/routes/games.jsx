import React from 'react';

import { useSelect } from 'key-value-database';

import db from '../database';
import { Link } from 'react-sprout';

export default function Games() {
	let games = useSelect(db, 'games');

	return (
		<div>
			<h1>Games</h1>
			<ul>
				{games.map((game) => (
					<li key={game.id}>
						<Link href={game.id}>Game: {game.id}</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
