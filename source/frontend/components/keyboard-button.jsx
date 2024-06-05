import React from 'react';

export default function KeyboardButton(props) {
	let { value, onClick } = props;

	function handleTouchStart(event) {
		event.preventDefault();
		onClick();
	}

	return (
		<button
			onClick={onClick}
			onTouchStart={handleTouchStart}
			type="button"
			className="bg-gray-600 p-4 active:bg-gray-500"
			data-value={value}
		>
			{value}
		</button>
	);
}
