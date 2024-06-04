import React from 'react';

export default function KeyboardButton(props) {
	let { value, onClick } = props;

	return (
		<button
			onClick={onClick}
			onTouchStart={onClick}
			type="button"
			className="bg-gray-600 p-4 active:bg-gray-500"
			data-value={value}
		>
			{value}
		</button>
	);
}
