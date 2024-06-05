import { useEffect } from 'react';

export default function useWakeLock() {
	useEffect(() => {
		let wakeLock;
		async function run() {
			try {
				wakeLock = await navigator.wakeLock.request('screen');
			} catch (err) {
				// noop
			}
		}

		run();

		return () => {
			wakeLock?.release();
		};
	}, []);
}
