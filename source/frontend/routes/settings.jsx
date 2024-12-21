import React, { useEffect } from 'react';
import { DownloadIcon, UploadIcon } from 'lucide-react';
import { NotImplementedError } from 'http-errors';

import db from '../database';
import Header from '../components/header';
import { useActionResult, useForm } from 'react-sprout';
import BackButton from '../components/back-button';

export async function settingsActions({ data }) {
	let { intent } = data;

	if (intent === 'import_data') {
		let { file } = data;

		let reader = new FileReader();
		reader.readAsText(file, 'UTF-8');
		reader.onload = function (event) {
			try {
				let data = JSON.parse(event.target.result);
				db.storage.value.clear();
				for (let [key, value] of data) {
					db.storage.value.setItem(key, value);
				}
			} catch (error) {
				console.error(error);
				throw new Error('Something went wrong importing your data');
			}
		};
		reader.onerror = function (event) {
			console.error(event);
			throw new Error('Something went wrong importing your data');
		};

		return { intent: 'import_data', ok: true };
	}

	if (intent === 'export_data') {
		let backup = Object.entries(db.storage.value);
		return { intent, data: JSON.stringify(backup) };
	}

	throw new NotImplementedError();
}

export default function Settings() {
	let [ImportDataForm] = useForm();
	let [ExportDataForm] = useForm();
	let result = useActionResult();

	useEffect(() => {
		if (result == undefined) return;
		if (result.intent === 'import_data') {
			if (result.ok) alert(`You're data has been imported successfully`);
		} else if (result.intent === 'export_data') {
			let downloadLink = document.createElement('a');
			downloadLink.href = `data:text/json;charset=utf-8,${encodeURIComponent(result.data)}`;
			downloadLink.download = 'export.json';
			downloadLink.click();
		}
	}, [result]);

	return (
		<div className="grid h-full grid-rows-[max-content,auto]">
			<Header>
				<h1 className="flex items-center gap-4">
					<BackButton />
					<span>Settings</span>
				</h1>
			</Header>
			<div className="px-4">
				<div className="flex gap-4">
					<ImportDataForm
						method="post"
						replace
						encType="multipart/form-data"
						onSubmit={event => {
							const ok = confirm(
								'Are you sure you want to import this data file. All your existing data will be overwritten?',
							);
							if (ok) return;
							event.preventDefault();
						}}
						onActionError={() => {
							alert('Something went wrong importing your data');
						}}
					>
						<input type="file" name="file" accept="application/json" />
						<button type="submit" name="intent" value="import_data" className="-m-2 p-2">
							<UploadIcon className="size-7" />
						</button>
					</ImportDataForm>

					<ExportDataForm method="post" replace>
						<button type="submit" name="intent" value="export_data" className="-m-2 p-2">
							<DownloadIcon className="size-7" />
						</button>
					</ExportDataForm>
				</div>
			</div>
		</div>
	);
}
