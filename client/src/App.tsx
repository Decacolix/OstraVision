import { Routes, Route, NavLink } from 'react-router';
import { useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';

import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import CultureGastroPage from './pages/CultureGastroPage';
import AboutPage from './pages/AboutPage';
import NotFound from './layout/NotFound';
import ProjectDetailPage from './projects/ProjectDetailPage';
import MapView from './layout/MapView';
import {
	NAV_ITEMS,
	NAV_LINK_ACTIVE,
	NAV_LINK_BASE,
	NAV_LINK_INACTIVE,
} from './utils/constants';
import Api from './pages/Api';

/* App component. */
const App = () => {
	/* Leaflet map instance ref (optional now, but ready for pins/fitBounds later). */
	const mapRef = useRef<LeafletMap | null>(null);

	/* Mobile right panel (menu) open/close state. */
	const [isMenuActive, setIsMenuActive] = useState<boolean>(false);

	const toggleMenu = (): void => setIsMenuActive(v => !v);

	/* Right panel classes depend on menu state (mobile slide-in). */
	const rightPanelClasses: string = [
		'absolute h-screen w-screen right-0 bg-white 2xl:translate-x-0 2xl:opacity-100 2xl:relative 2xl:basis-2/5 flex flex-col z-1000 duration-600 ease-in-out max-w-[765px] min-h-[820px]',
		isMenuActive ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
	].join(' ');

	/* Menu icon sources depend on open/close state. */
	const menuIconSrc: string = `/src/assets/icons/${
		isMenuActive ? 'close-icon.svg' : 'menu-icon.svg'
	}`;
	const menuIconHoverSrc: string = `/src/assets/icons/${
		isMenuActive ? 'close-icon-hover.svg' : 'menu-icon-hover.svg'
	}`;

	return (
		<div className="min-h-screen flex font-montserrat justify-between">
			{/* Left side: logo header + map. */}
			<div className="basis-5/5 2xl:basis-3/5 flex flex-col">
				{/* Top header row (fixed). */}
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

					{/* Mobile menu button (hidden on 2xl). */}
					<button
						type="button"
						className="px-3 cursor-pointer 2xl:hidden z-2000 self-end"
						onClick={toggleMenu}
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

				{/* Map component. */}
				<MapView mapRef={mapRef} />
			</div>

			{/* Right side: nav + routes (slide-in on mobile). */}
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

				{/* Routes for navigation. */}
				<main className="flex-1 flex items-center justify-center text-center px-6 py-4">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/projekty" element={<ProjectsPage />} />
						<Route path="/projekty/:id" element={<ProjectDetailPage />} />
						<Route path="/kultura-gastro" element={<CultureGastroPage />} />
						<Route path="/o-nas" element={<AboutPage />} />
						<Route path="/api" element={<Api />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</main>
			</div>
		</div>
	);
};

export default App;
