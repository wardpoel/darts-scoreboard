import React from 'react';
import { Link } from 'react-sprout';
import Header from '../components/header';

export default function Home() {
	return (
		<div className="grid h-full grid-rows-[max-content,auto]">
			<Header>
				<h1>Darts Scoreboard</h1>
			</Header>
			<div className="grid grid-rows-3 gap-4 px-4 self-y-center">
				<Link href="new" className="rounded-md bg-blue-500 p-4 text-center text-2xl">
					New game
				</Link>
				<Link href="games" className="rounded-md bg-blue-500 p-4 text-center text-2xl">
					Games
				</Link>
				<Link href="players" className="rounded-md bg-blue-500 p-4 text-center text-2xl">
					Players
				</Link>
			</div>
		</div>
	);
}
