import React from 'react';
import { Link, useHistory } from 'react-sprout';

import BackIcon from './icons/back-icon';
import { historyLength } from '../router';

export default function BackButton() {
	let history = useHistory();

	function handleClick() {
		history.back();
	}

	let hasNavigatedInApp = history.length > historyLength;
	if (hasNavigatedInApp) {
		return (
			<button onClick={handleClick} className="-m-2 p-2">
				<BackIcon className="size-7" />
			</button>
		);
	}

	return (
		<Link href=".." replace className="-m-2 p-2">
			<BackIcon className="size-7" />
		</Link>
	);
}
