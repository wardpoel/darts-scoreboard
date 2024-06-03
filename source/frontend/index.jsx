import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import entriesToObject from 'entries-to-object';

import Router from './router.jsx';

let root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Suspense fallback={null}>
			<Router dataTransform={entriesToObject} />
		</Suspense>
	</React.StrictMode>,
);
