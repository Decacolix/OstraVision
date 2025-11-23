import { Routes, Route, NavLink } from 'react-router';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import CultureGastroPage from './pages/CultureGastroPage';
import AboutPage from './pages/AboutPage';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useRef } from 'react';

const navLinkBaseClasses = 'navlink px-6 cursor-pointer';
const navLinkActiveClasses = 'text-odb';
const navLinkInactiveClasses = 'text-olb';

const App = () => {
	const mapRef = useRef(null);
	const latitude = 49.81637370301487;
	const longitude = 18.227087042101008;

	return (
		<div className="min-h-screen flex font-montserrat">
			<div className="basis-3/5 flex flex-col">
				<div className="pt-4 px-4 z-10">
					<NavLink to="/" end>
						<img
							src="src/assets/images/logo.svg"
							alt="ostravision logo"
							width={250}
						/>
					</NavLink>
				</div>
				<div className="m-4 flex flex-1 items-center justify-center">
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
						{/* Additional map layers or components can be added here */}
					</MapContainer>
				</div>
			</div>
			<div className="flex-1 flex flex-col">
				<nav className="sticky top-0 z-10 flex items-center justify-center px-5 py-3 text-xl font-semibold bg-white">
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
				<main className="flex-1 flex items-center justify-center text-center px-8 py-4">
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
