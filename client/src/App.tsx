import { Routes, Route, NavLink } from 'react-router';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useMemo, useRef, useState } from 'react';

import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import CultureGastroPage from './pages/CultureGastroPage';
import AboutPage from './pages/AboutPage';
import NotFound from './layout/NotFound';
import ProjectDetailPage from './projects/ProjectDetailPage';

const NAV_LINK_BASE: string =
	'navlink cursor-pointer wrap text-center text-sm sm:text-base mt-12 px-2 md:px-4 lg:mt-0';
const NAV_LINK_ACTIVE: string = 'text-odb';
const NAV_LINK_INACTIVE: string = 'text-olb';

const MAP_CENTER: [number, number] = [49.81637370301487, 18.227087042101008];

type NavItem = { to: string; label: string };

const NAV_ITEMS: NavItem[] = [
	{ to: '/projekty', label: 'PROJEKTY' },
	{ to: '/kultura-gastro', label: 'KULTURA & GASTRO' },
	{ to: '/o-nas', label: 'O NÁS' },
];

const App = () => {
	const mapRef = useRef<null>(null);
	const [isMenuActive, setIsMenuActive] = useState<boolean>(false);

	const toggleMenu = (): void => setIsMenuActive(v => !v);

	const rightPanelClasses = useMemo<string>(
		() =>
			[
				'absolute h-screen w-screen right-0 bg-white 2xl:translate-x-0 2xl:opacity-100 2xl:relative 2xl:basis-2/5 flex flex-col z-1000 duration-600 ease-in-out',
				isMenuActive
					? 'translate-x-0 opacity-100'
					: 'translate-x-full opacity-0',
			].join(' '),
		[isMenuActive]
	);

	const menuIconSrc = useMemo<string>(
		() =>
			`/src/assets/icons/${isMenuActive ? 'close-icon.svg' : 'menu-icon.svg'}`,
		[isMenuActive]
	);

	const menuIconHoverSrc = useMemo<string>(
		() =>
			`/src/assets/icons/${
				isMenuActive ? 'close-icon-hover.svg' : 'menu-icon-hover.svg'
			}`,
		[isMenuActive]
	);

	return (
		<div className="min-h-screen flex font-montserrat">
			<div className="basis-5/5 2xl:basis-3/5 flex flex-col">
				<div className="fixed flex justify-between z-2000 w-full 2xl:w-auto pb-2 bg-white">
					<div className="pt-3 px-4 z-10">
						<NavLink to="/" end>
							<img
								src="/src/assets/images/logo.svg"
								alt="ostravision logo"
								width={250}
							/>
						</NavLink>
					</div>

					<button
						type="button"
						className="px-3 cursor-pointer 2xl:hidden z-2000 self-end"
						onClick={toggleMenu}
						aria-label="Toggle menu"
					>
						<img
							src={menuIconSrc}
							alt="menu icon"
							width={27.5}
							onMouseOver={e => (e.currentTarget.src = menuIconHoverSrc)}
							onMouseOut={e => (e.currentTarget.src = menuIconSrc)}
						/>
					</button>
				</div>

				<div className="mx-4 mt-12 mb-4 flex flex-1 items-center justify-center">
					<MapContainer
						center={MAP_CENTER}
						zoom={12}
						ref={mapRef}
						style={{ height: '100%', width: '100%' }}
					>
						<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
					</MapContainer>
				</div>
			</div>

			<div className={rightPanelClasses}>
				<nav className="sticky top-0 z-10 flex items-center justify-center px-5 py-3 text-lg font-semibold bg-white">
					{NAV_ITEMS.map(item => (
						<NavLink
							key={item.to}
							to={item.to}
							end
							className={({ isActive }) =>
								[
									NAV_LINK_BASE,
									isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE,
								].join(' ')
							}
						>
							{item.label}
						</NavLink>
					))}
				</nav>

				<main className="flex-1 flex items-center justify-center text-center px-6 py-4">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/projekty" element={<ProjectsPage />} />
						<Route path="/projekty/:id" element={<ProjectDetailPage />} />
						<Route path="/kultura-gastro" element={<CultureGastroPage />} />
						<Route path="/o-nas" element={<AboutPage />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</main>
			</div>
		</div>
	);
};

export default App;
