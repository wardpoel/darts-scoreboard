import React from 'react';

import { useFind } from 'key-value-database';
import db from '../database';

export default function PlayerName(props) {
	let { id } = props;
	let player = useFind(db, 'players', id);

	return <>{player?.name ?? id}</>;
}
