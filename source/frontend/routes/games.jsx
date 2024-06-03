import React from 'react';

import { useSelect } from 'key-value-database';
import { Link } from 'react-sprout';

import Header from '../components/header';
import BackIcon from '../components/icons/back-icon';
import db from '../database';

export default function Games() {
	let games = useSelect(db, 'games');

	return (
		<div>
			<Header>
				<h1 className="flex items-center gap-4">
					<Link href=".." push={false}>
						<BackIcon className="size-7" />
					</Link>
					<span>Games</span>
				</h1>
			</Header>

			<ul className="grid grid-cols-1 gap-2 p-4">
				{games.map(game => (
					<li key={game.id}>
						<Link href={game.id}>Game: {game.id}</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
