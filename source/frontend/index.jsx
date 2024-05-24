import React from 'react';
import ReactDOM from 'react-dom/client';
import entriesToObject from 'entries-to-object';

import Router from './router.jsx';

let root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Router dataTransform={entriesToObject} />
	</React.StrictMode>
);
