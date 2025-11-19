import { useEffect, useState } from 'react';
import catGif from './assets/cat.gif';

function App() {
	const [dbInfo, setDbInfo] = useState<string>('');
	const [authors, setAuthors] = useState<string>('');
	const [contractors, setContractors] = useState<string>('');
	const [investors, setInvestors] = useState<string>('');
	const [locations, setLocations] = useState<string>('');
	const [photos, setPhotos] = useState<string>('');
	const [sources, setSources] = useState<string>('');
	const [structures, setStructures] = useState<string>('');
	const [updates, setUpdates] = useState<string>('');
	const [writers, setWriters] = useState<string>('');

	useEffect(() => {
		fetch('http://localhost:3000/')
			.then(response => response.json())
			.then(data => {
				setDbInfo(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/authors')
			.then(response => response.json())
			.then(data => {
				setAuthors(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/contractors')
			.then(response => response.json())
			.then(data => {
				setContractors(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/investors')
			.then(response => response.json())
			.then(data => {
				setInvestors(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/locations')
			.then(response => response.json())
			.then(data => {
				setLocations(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/photos')
			.then(response => response.json())
			.then(data => {
				setPhotos(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/sources')
			.then(response => response.json())
			.then(data => {
				setSources(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/structures')
			.then(response => response.json())
			.then(data => {
				setStructures(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/updates')
			.then(response => response.json())
			.then(data => {
				setUpdates(data);
			});
	});

	useEffect(() => {
		fetch('http://localhost:3000/api/data/writers')
			.then(response => response.json())
			.then(data => {
				setWriters(data);
			});
	});

	function createTable(name: string, data: string) {
		const keys = Object.keys(data[0] || {});
		let table = '<table><caption>Tabulka ' + name + '</caption><tr>';

		for (let i = 0; i < keys.length; i++) {
			table += '<th>' + keys[i].toUpperCase() + '</th>';
		}

		for (let i = 0; i < data.length; i++) {
			table += '<tr>';

			for (let j = 0; j < keys.length; j++) {
				table += '<td>' + data[i][keys[j] as never] + '</td>';
			}

			table += '</tr>';
		}

		table += '</tr></table>';

		return table;
	}

	return (
		<>
			<h1>OstraVision</h1>
			<p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
				Aplikace úspěšně připojena k serveru, který získává data z databáze. Zde
				jsou data z databáze:
			</p>
			<p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
				Informace o databázi získané ze serveru:
			</p>
			<p style={{ fontWeight: 'bold' }}>
				HOST: {JSON.stringify(dbInfo['dbHost' as never])}
			</p>
			<p style={{ fontWeight: 'bold' }}>
				PORT: {JSON.stringify(dbInfo['dbPort' as never])}
			</p>
			<p style={{ fontWeight: 'bold' }}>
				UŽIVATEL: {JSON.stringify(dbInfo['dbUser' as never])}
			</p>
			<p style={{ fontWeight: 'bold' }}>
				DATABÁZE: {JSON.stringify(dbInfo['dbDatabase' as never])}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Authors (Autoři)', authors),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Contractors (Kontraktoři)', contractors),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Inverstors (Investoři)', investors),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Locations (Lokace)', locations),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Photos (Fotky)', photos),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Sources (Zdroje)', sources),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Structures (Struktury)', structures),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Updates (Aktualizace)', updates),
				}}
			>
				{}
			</p>
			<p
				style={{ fontFamily: 'Consolas' }}
				dangerouslySetInnerHTML={{
					__html: createTable('Spisovatelé (Writers)', writers),
				}}
			>
				{}
			</p>
			<p>
				<img src={catGif}></img>
			</p>
		</>
	);
}

export default App;
