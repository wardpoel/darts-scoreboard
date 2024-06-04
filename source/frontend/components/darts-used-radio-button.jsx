import React from 'react';

export default function DartsUsedRadioButton(props) {
	let { id, value, defaultChecked } = props;
	return (
		<div className="contents">
			<input className="peer" type="radio" id={id} name="darts" value={value} hidden defaultChecked={defaultChecked} />
			<label htmlFor={id} className="cursor-pointer p-4 text-gray-500 peer-checked:text-gray-200">
				{value}
			</label>
		</div>
	);
}
