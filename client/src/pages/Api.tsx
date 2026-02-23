/* API page component. */
const Api = () => {
	return (
		<div className="w-full max-h-[750px] overflow-y-scroll ">
			<div className="text-left mr-4">
				<p className="mb-2 font-semibold">
					Nabízíme zdarma využití našeho API k získání dat ve formátu JSON.
				</p>
				<p className="mb-2">
					Informace o API naleznete na&nbsp;
					<a
						href="http://localhost:3000/api/data"
						className="text-odb hover:text-olb"
						target="_blank"
					>
						ostravision.cz/api/data
					</a>
					.
				</p>
				<p className="mb-2">Seznam jednotlivých endpointů:</p>
				<ul className="list-disc ml-5 mb-4">
					<li>
						<a
							href="http://localhost:3000/api/data/writers/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/writers/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/updates/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/updates/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/structures/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/structures/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/authors/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/authors/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/investors/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/investors/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/contractors/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/contractors/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/locations/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/locations/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/sources/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/sources/
						</a>
					</li>
					<li>
						<a
							href="http://localhost:3000/api/data/photos/"
							className="text-odb hover:text-olb"
							target="_blank"
						>
							ostravision.cz/api/data/photos/
						</a>
					</li>
				</ul>
				<p className="mb-2 border-t-2 border-odb pt-4">
					Pro získání data konkrétního záznamu použijte formát
					<span className="font-semibold">&nbsp;/api/data/endpoint/id</span>. ID
					konkrétního projektu naleznete v URL detailu projektu.
				</p>
				<p className="mb-2">Příklad:</p>
				<div className="bg-odb p-2 mb-4">
					<code className="text-white break-all">
						ostravision.cz/api/data/structures/abcdabcd-0000-1111-2222-abcdabcd
					</code>
				</div>
				<p className="mb-2 border-t-2 border-odb pt-4">
					API podporuje následující filtry:
				</p>
				<ul className="list-disc ml-5 mb-2">
					<li>
						<span className="font-semibold">order_by</span> | Seřazení dle
						konkrétního políčka
					</li>
					<li>
						<span className="font-semibold">order_dir</span> | Vzestupné (asc)
						nebo sestupné (desc) seřazení
					</li>
					<li>
						<span className="font-semibold">nulls</span> | Null hodnoty se
						zobrazí jako první (first) nebo poslední (last) v seznamu
					</li>
					<li>
						<span className="font-semibold">limit</span> | Omezí počet
						zobrazených záznamů na konkrétní hodnotu
					</li>
					<li>
						<span className="font-semibold">offset</span> | Odsazení o určitý
						počet záznamů
					</li>
				</ul>
				<p className="mb-2">Příklad:</p>
				<div className="bg-odb p-2 mb-4">
					<code className="text-white break-all">
						ostravision.cz/api/data/structures?limit=20&offset=10&order_by=budget&order_dir=desc&nulls=first
					</code>
				</div>
				<p className="mb-2 border-t-2 border-odb pt-4">
					Pro filtrování záznamů s klíčem jiného záznamu, použijte formát
					<span className="font-semibold">
						&nbsp;/api/data/endpoint/key=value
					</span>
					.
				</p>
				<p className="mb-2">Příklad:</p>
				<div className="bg-odb p-2 mb-4">
					<code className="text-white break-all">
						ostravision.cz/api/data/structures?author_id=01234567-abcd-abcd-abcd-01234567
					</code>
				</div>
				<p className="mb-4 border-t-2 border-odb pt-4">Formát JSON záznamu:</p>
				<div className="bg-odb p-2 mb-2">
					<code className="text-white break-all">
						{'{'} <br />
						"items": "pole záznamů",
						<br /> "total": "počet záznamů",
						<br /> "limit": "limit záznamů",
						<br /> "offset": "odsazení záznamů" <br />
						{'}'};
					</code>
				</div>
			</div>
		</div>
	);
};

export default Api;
