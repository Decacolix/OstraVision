import { Routes, Route, NavLink } from 'react-router';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import CultureGastroPage from './pages/CultureGastroPage';
import AboutPage from './pages/AboutPage';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useRef, useState } from 'react';

const navLinkBaseClasses: string =
	'navlink cursor-pointer wrap text-center text-sm sm:text-base mt-12 px-2 md:px-4 lg:mt-0';
const navLinkActiveClasses: string = 'text-odb';
const navLinkInactiveClasses: string = 'text-olb';

const App = () => {
	const mapRef = useRef<null>(null);
	const latitude: number = 49.81637370301487;
	const longitude: number = 18.227087042101008;

	const [isMenuActive, setIsMenuActive] = useState<boolean>(false);

	const handleMenuActive = (): void => {
		setIsMenuActive(isMenuActive => !isMenuActive);
	};

	return (
		<div className="min-h-screen flex font-montserrat">
			<div className="basis-5/5 2xl:basis-3/5 flex flex-col">
				<header className="fixed flex justify-between z-2000 w-full">
					<div className="pt-3 px-4 z-10">
						<NavLink to="/" end>
							<img
								src="src/assets/images/logo.svg"
								alt="ostravision logo"
								width={250}
							/>
						</NavLink>
					</div>

					<div
						className="px-3 cursor-pointer 2xl:hidden z-2000 self-end"
						onClick={() => handleMenuActive()}
					>
						<img
							src={`src/assets/icons/${
								isMenuActive ? 'close-icon.svg' : 'menu-icon.svg'
							}`}
							alt="menu icon"
							width={27.5}
						/>
					</div>
				</header>
				<div className="mx-4 mt-12 mb-4 flex flex-1 items-center justify-center">
					<MapContainer
						center={[latitude, longitude]}
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
			<div
				className={[
					'absolute h-screen w-screen right-0 bg-white 2xl:translate-x-0 2xl:opacity-100 2xl:relative 2xl:basis-2/5 flex flex-col z-1000 duration-600 ease-in-out',
					isMenuActive
						? 'translate-x-0 opacity-100'
						: 'translate-x-full opacity-0',
				].join(' ')}
			>
				<nav className="sticky top-0 z-10 flex items-center justify-center px-5 py-3 text-lg font-semibold bg-white">
					<NavLink
						to="/projekty"
						end
						className={({ isActive }) =>
							[
								navLinkBaseClasses,
								isActive ? navLinkActiveClasses : navLinkInactiveClasses,
							].join(' ')
						}
					>
						PROJEKTY
					</NavLink>
					<NavLink
						to="/kultura-gastro"
						end
						className={({ isActive }) =>
							[
								navLinkBaseClasses,
								isActive ? navLinkActiveClasses : navLinkInactiveClasses,
							].join(' ')
						}
					>
						KULTURA & GASTRO
					</NavLink>
					<NavLink
						to="/o-nas"
						end
						className={({ isActive }) =>
							[
								navLinkBaseClasses,
								isActive ? navLinkActiveClasses : navLinkInactiveClasses,
							].join(' ')
						}
					>
						O NÁS
					</NavLink>
				</nav>
				<main className="flex-1 flex items-center justify-center text-center px-6 py-4">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/projekty" element={<ProjectsPage />} />
						<Route path="/kultura-gastro" element={<CultureGastroPage />} />
						<Route path="/o-nas" element={<AboutPage />} />
						<Route path="*" element={<HomePage />} />
					</Routes>
				</main>
			</div>
		</div>
	);
};

export default App;
