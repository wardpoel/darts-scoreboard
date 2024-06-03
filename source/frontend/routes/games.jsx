import React, { Suspense } from 'react';

import { Link, useLoaderResult } from 'react-sprout';

import Header from '../components/header';
import BackIcon from '../components/icons/back-icon';
import db from '../database';

export async function gamesLoader() {
	return db.select('games');
}

export default function Games() {
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

			<Suspense>
				<GamesView />
			</Suspense>
		</div>
	);
}

function GamesView() {
	let games = useLoaderResult();

	return (
		<ul className="grid grid-cols-1 gap-2 p-4">
			{games.map(game => (
				<li key={game.id}>
					<Link href={game.id}>Game: {game.id}</Link>
				</li>
			))}
		</ul>
	);
}
