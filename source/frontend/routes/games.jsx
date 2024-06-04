import React, { Suspense } from 'react';

import { Link, useLoaderResult } from 'react-sprout';

import Header from '../components/header';
import db from '../database';
import BackButton from '../components/back-button';

export async function gamesLoader() {
	return db.select('games');
}

export default function Games() {
	return (
		<div className="grid h-full grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center gap-4">
					<BackButton />
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
		<div className="grid h-full grid-cols-1 grid-rows-[minmax(0,1fr),max-content] overflow-y-auto">
			<ul className="grid max-h-full grid-cols-1 divide-y divide-gray-700 overflow-y-auto py-1 self-y-start">
				{games.map(game => (
					<li key={game.id}>
						<Link href={game.id}>Game: {game.id}</Link>
					</li>
				))}
			</ul>

			<Link href="/new" className="flex flex-col gap-2 rounded-md bg-blue-500 p-4 text-center text-2xl">
				New game
			</Link>
		</div>
	);
}
