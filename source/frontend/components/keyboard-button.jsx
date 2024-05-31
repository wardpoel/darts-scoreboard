import React from 'react';

export default function KeyboardButton(props) {
	let { value, onClick } = props;

	return (
		<button onClick={onClick} type="button" className="p-4 bg-gray-600 active:bg-gray-500" data-value={value}>
			{value}
		</button>
	);
}
