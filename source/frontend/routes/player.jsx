import React from 'react';
import { Link, useForm, useLoaderResult, useLocation, useNavigate } from 'react-sprout';
import { NotFoundError } from 'http-errors';
import db from '../database';
import Header from '../components/header';
import BackButton from '../components/back-button';
import { BarChart2Icon, JoystickIcon, TrashIcon } from 'lucide-react';
import { SCORE_PRESETS } from './new';
import { CHECKOUT_TYPE } from './root';
import Suspense from '../components/suspense';

export async function playerLoader(request) {
	let { params } = request;

	let player = db.find('players', params.playerId);
	if (player == undefined) throw new NotFoundError('Player not found');

	return player;
}

export default function Player(props) {
	let player = useLoaderResult();
	let location = useLocation();
	let [navigate] = useNavigate();
	let [DeletePlayerForm] = useForm();

	let searchParams = location.searchParams;
	let currentScore = searchParams.get('score') ?? 'all';
	let currentCheckout = searchParams.get('checkout') ?? 'all';

	function handleScoreChange(event) {
		let value = event.target.value;

		let searchParams = new URLSearchParams(location.search);
		searchParams.set('score', value);

		navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
	}

	function handleCheckoutChange(event) {
		let value = event.target.value;

		let searchParams = new URLSearchParams(location.search);
		searchParams.set('checkout', value);

		navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
	}

	return (
		<div className="grid h-full grid-rows-[max-content,max-content,auto]">
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

			<div>
				<div className="bg-blue-500">
					<nav className="mx-auto grid grid-cols-2 font-semibold md:max-w-lg">
						<Tab href="stats" icon={<BarChart2Icon />} title="Stats" />
						<Tab href="games" icon={<JoystickIcon />} title="Games" />
					</nav>
				</div>

				<div className="p-4">
					<div className="grid grid-cols-5 gap-2 text-sm">
						{['all', ...SCORE_PRESETS].map(score => (
							<div key={score} className="flex-grow">
								<input
									type="radio"
									hidden
									readOnly
									id={`score-${score}`}
									name="score"
									value={score}
									checked={currentScore === score.toString()}
									className="peer"
									onChange={handleScoreChange}
								/>
								<label
									htmlFor={`score-${score}`}
									className="block rounded-md border-2 border-gray-500 p-3 text-center uppercase peer-checked:border-blue-500 peer-checked:bg-blue-500"
								>
									{score}
								</label>
							</div>
						))}
					</div>

					<div className="mt-2 grid grid-cols-4 gap-2 text-sm">
						{['all', ...Object.keys(CHECKOUT_TYPE)].map(checkout => (
							<div key={checkout}>
								<input
									type="radio"
									hidden
									readOnly
									id={`checkout-${checkout}`}
									name="checkout"
									value={checkout}
									checked={currentCheckout === checkout}
									className="peer"
									onChange={handleCheckoutChange}
								/>
								<label
									htmlFor={`checkout-${checkout}`}
									className="block rounded-md border-2 border-gray-500 p-3 text-center uppercase peer-checked:border-blue-500 peer-checked:bg-blue-500"
								>
									{checkout}
								</label>
							</div>
						))}
					</div>
				</div>
			</div>

			<main className="overflow-y-auto">
				<Suspense>{props.children}</Suspense>
			</main>
		</div>
	);
}

function Tab(props) {
	let { href, icon, title } = props;
	let location = useLocation();
	let searchParams = location.searchParams;

	let active = location.pathname.includes(href);

	return (
		<Link
			href={`./${href}?${searchParams.toString()}`}
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
