import React from 'react';
import { Link } from 'react-sprout';
import Header from '../components/header';

export default function Home() {
	return (
		<div className="grid grid-rows-[max-content,auto] h-full">
			<Header>
				<h1>Darts Scoreboard</h1>
			</Header>
			<div className="px-4 self-y-center grid grid-rows-3 gap-4">
				<Link href="new" className="p-4 bg-blue-500 text-center text-2xl rounded-md">
					New game
				</Link>
				<Link href="games" className="p-4 bg-blue-500 text-center text-2xl rounded-md">
					Games
				</Link>
				<Link href="players" className="p-4 bg-blue-500 text-center text-2xl rounded-md">
					Players
				</Link>
			</div>
		</div>
	);
}
