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
			<Link href=".." replace>
				<BackIcon className="size-7" />
			</Link>
		);
	}

	return (
		<button onClick={handleClick}>
			<BackIcon className="size-7" />
		</button>
	);
}
