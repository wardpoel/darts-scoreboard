import React from 'react';
import { Link, useHistory } from 'react-sprout';

import { historyLength } from '../router';
import { ArrowLeftIcon } from 'lucide-react';

export default function BackButton() {
	let history = useHistory();

	function handleClick() {
		history.back();
	}

	let hasNavigatedInApp = history.length > historyLength;
	if (hasNavigatedInApp) {
		return (
			<button onClick={handleClick} className="-m-2 p-2">
				<ArrowLeftIcon className="size-7" />
			</button>
		);
	}

	return (
		<Link href=".." replace className="-m-2 p-2">
			<ArrowLeftIcon className="size-7" />
		</Link>
	);
}
