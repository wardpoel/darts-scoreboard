import React from 'react';

export default function Header(props) {
	return <header className="font-semibold -mt-4 -mx-4 p-4 bg-blue-500 text-white text-xl">{props.children}</header>;
}
