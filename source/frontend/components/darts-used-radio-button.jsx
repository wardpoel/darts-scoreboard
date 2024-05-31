import React from 'react';

export default function DartsUsedRadioButton(props) {
	let { id, value } = props;
	return (
		<div className="contents">
			<input className="peer" type="radio" id={id} name="darts" value={value} hidden defaultChecked />
			<label htmlFor={id} className="peer-checked:text-gray-200 text-gray-500 cursor-pointer p-4">
				{value}
			</label>
		</div>
	);
}
