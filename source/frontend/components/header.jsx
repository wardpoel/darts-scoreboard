import React from 'react';

export default function Header(props) {
	return <header className="bg-blue-500 p-4 text-xl font-semibold">{props.children}</header>;
}
