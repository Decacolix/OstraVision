import ProjectListItem from '../projects/ProjectListItem';
import ProjectSortBar from '../projects/ProjectSortBar';

const ProjectsPage = () => {
	return (
		<div className="flex flex-col w-full max-h-[800px] overflow-y-scroll pr-4">
			<div className="my-4">
				<ProjectSortBar
					sortType="alphabetical"
					sortDirection="asc"
					onChangeSortType={() => 'time'}
					onChangeSortDirection={() => 'desc'}
				/>
			</div>
			<div className="flex flex-col items-start">
				<div className="my-4 w-full">
					<ProjectListItem
						structure={{
							structure_id: '0000-1111-2222-3333',
							name: 'Skvělý nový obchod s fialovými květinami',
							description:
								'Budeme prodávat všechny druhy fialových květin. Fialky, levandule, motýlí keře, prvosenky patrovité, jaterníky i rododendrony.',
							key: '0000',
							type: 1,
						}}
						photoUrl={
							'https://fastly.picsum.photos/id/152/1000/1000.jpg?hmac=PROUM_wXGBei6hWzAx70AbTAJJOuTh5-aSwVQAycddw'
						}
						lastUpdatedLabel={'2025-12-26T18:43:00.492Z'}
					/>
				</div>

				<div className="my-4 w-full">
					<ProjectListItem
						structure={{
							structure_id: '0000-1111-2222-3333',
							name: 'Nové moře pro Ostravu',
							description:
								'Vybudujeme v Ostravě nové moře, které bude sloužit pro lekce plavání. Moře vznikne rozšířením hlučínské štěrkovny.',
							key: '0000',
							type: 2,
						}}
						photoUrl={
							'https://fastly.picsum.photos/id/969/500/800.jpg?hmac=v7J-44TubU6Cvlr1jzw_gTgHKw6EcHJmfDk2aLMK7jw'
						}
						lastUpdatedLabel={'2025-12-25T18:43:00.492Z'}
					/>
				</div>

				<div className="my-4 w-full">
					<ProjectListItem
						structure={{
							structure_id: '0000-1111-2222-3333',
							name: 'Voda z termálních pramenů',
							description:
								'Budeme prodávat horkou vodu z termálních pramenů. Doporučujeme koupit co nejdřív po dovezení.',
							key: '0000',
							type: 1,
						}}
						photoUrl={
							'https://fastly.picsum.photos/id/512/1500/2000.jpg?hmac=eHz-x7fgW9JDm3wASMRhei9zrc73Drsw_7Khnq48f1g'
						}
						lastUpdatedLabel={'2025-12-18T18:43:00.492Z'}
					/>
				</div>
				<div className="my-4 w-full">
					<ProjectListItem
						structure={{
							structure_id: '0000-1111-2222-3333',
							name: 'Vodní skluzavka z Haldy Emy',
							description:
								'Nový zábavný způsob dopravy míří do Ostravy. Z Haldy Emy se nyní sklouznete až do Krásného Pole!',
							key: '0000',
							type: 3,
						}}
						photoUrl={
							'https://fastly.picsum.photos/id/938/1000/1000.jpg?hmac=M0naFzh07MQGf4T93uIGHdS9BgD_JM0nCJJtSjogusI'
						}
						lastUpdatedLabel={'2025-10-05T18:43:00.492Z'}
					/>
				</div>
				<div className="my-4 w-full">
					<ProjectListItem
						structure={{
							structure_id: '0000-1111-2222-3333',
							name: 'Most přes Starobělský potok',
							description:
								'Nový velký most přes Starobělský potok bude sloužit pro automobilovou, tramvajovou i pěší dopravu.',
							key: '0000',
						}}
						photoUrl={
							'https://fastly.picsum.photos/id/47/500/500.jpg?hmac=oR6Yd_hDK4t0WwKQhjlllnB3KKSmXv3qKyvjl6X3UD4'
						}
						lastUpdatedLabel={'2024-01-02T18:43:00.492Z'}
					/>
				</div>
				<div className="my-4 w-full">
					<ProjectListItem
						structure={{
							structure_id: '0000-1111-2222-3333',
							name: 'Filtry pro komíny',
							description:
								'Dodávání filtrů pro komíny do každé domácnosti. Kdybyste neustále v krbech nepálili plastové flašky, nebylo by to třeba.',
							key: '0000',
						}}
						photoUrl={
							'https://fastly.picsum.photos/id/344/800/800.jpg?hmac=85fQPeiOir0A7XyvI6FZQQL57Bp8FiAK6fwfoIlI7JM'
						}
						lastUpdatedLabel={'2022-12-05T18:43:00.492Z'}
					/>
				</div>
			</div>
		</div>
	);
};

export default ProjectsPage;
