import React, { Suspense } from 'react';
import { Link, useForm, useLoaderResult, useLocation } from 'react-sprout';
import { NotFoundError } from 'http-errors';
import db from '../database';
import Header from '../components/header';
import BackButton from '../components/back-button';
import { BarChart2Icon, JoystickIcon, TrashIcon } from 'lucide-react';

export async function playerLoader(request) {
	let { params } = request;

	let player = db.find('players', params.playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	return player;
}

export default function Player(props) {
	let player = useLoaderResult();
	let [DeletePlayerForm] = useForm();

	return (
		<div>
			<Header>
				<h1 className="flex items-center justify-between">
					<span className="flex items-center gap-4">
						<BackButton />
						<span>{player.name}</span>
					</span>

					<DeletePlayerForm
						action="/players"
						method="post"
						replace
						className="contents"
						onSubmit={event => {
							const ok = confirm('Are you sure you want to delete this player?');
							if (ok) return;
							event.preventDefault();
						}}
					>
						<input name="playerId" value={player.id} type="hidden" readOnly />
						<button type="submit" name="intent" value="delete_player" className="-m-2 p-2">
							<TrashIcon className="size-7" />
						</button>
					</DeletePlayerForm>
				</h1>
			</Header>

			<div className="bg-blue-500">
				<nav className="mx-auto grid grid-cols-2 font-semibold md:max-w-lg">
					<Tab href="stats" icon={<BarChart2Icon />} title="Stats" />
					<Tab href="games" icon={<JoystickIcon />} title="Games" />
				</nav>
			</div>

			<main>
				<Suspense>{props.children}</Suspense>
			</main>
		</div>
	);
}

function Tab(props) {
	let { href, icon, title } = props;
	let location = useLocation();

	let active = location.pathname.includes(href);

	return (
		<Link
			href={`./${href}`}
			replace
			cache
			sticky={false}
			data-active={active}
			className="flex flex-col items-center gap-2 border-white py-3 data-[active=true]:border-b-2 data-[active=false]:text-blue-200 data-[active=true]:text-white"
		>
			{icon}
			<span className="text-sm uppercase">{title}</span>
		</Link>
	);
}
