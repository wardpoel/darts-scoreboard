import React from 'react';

export default function Header(props) {
	return <header className="font-semibold p-4 bg-blue-500 text-xl">{props.children}</header>;
}
