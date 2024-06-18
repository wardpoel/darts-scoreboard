import { Loader2Icon } from 'lucide-react';
import React, { Suspense as ReactSuspense } from 'react';

export default function Suspense(props) {
	return (
		<ReactSuspense
			fallback={
				<div className="flex h-full items-center justify-center">
					<Loader2Icon className="animate-spin" />
				</div>
			}
		>
			{props.children}
		</ReactSuspense>
	);
}
