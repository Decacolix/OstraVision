import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { API, CATEGORIES, DEFAULT_CENTER } from '../utils/constants';
import type { StructureRow } from '../types/StructureRow';
import type { LocationRow } from '../types/LocationRow';
import { initLeafletDefaultIcon } from '../utils/initLeafletDefaultIcon';
import type { MapPin } from '../types/MapPin';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Link } from 'react-router';
import locationIconOdb from '../assets/icons/location-icon-odb.svg';
import L from 'leaflet';
import Loader from './Loader';
import { formatCzk } from '../utils/formatCzk';
import { formatCoordinates } from '../utils/formatCoordinates';

type MapRefLike = { current: LeafletMap | null };

type Props = {
	mapRef?: MapRefLike;
	center?: [number, number];
	zoom?: number;
};

const BindMapRef = ({ mapRef }: { mapRef?: MapRefLike }) => {
	const map: LeafletMap = useMap();

	useEffect(() => {
		if (!mapRef) return;

		mapRef.current = map;

		return () => {
			mapRef.current = null;
		};
	}, [map, mapRef]);

	return null;
};

const toArray = <T,>(value: unknown): T[] => {
	if (Array.isArray(value)) return value as T[];

	if (value && typeof value === 'object') {
		const v = value as Record<string, unknown>;
		if (Array.isArray(v.rows)) return v.rows as T[];
		if (Array.isArray(v.data)) return v.data as T[];
		if (Array.isArray(v.items)) return v.items as T[];
		if (Array.isArray(v.result)) return v.result as T[];
	}

	return [];
};

const MapView = ({ mapRef, center = DEFAULT_CENTER, zoom = 12 }: Props) => {
	const [structures, setStructures] = useState<StructureRow[]>([]);
	const [locations, setLocations] = useState<LocationRow[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const projectIcon = useMemo(() => {
		return L.icon({
			iconUrl: locationIconOdb,
			iconSize: [34, 34],
			iconAnchor: [17, 34],
			popupAnchor: [0, -32],
			className: 'project-pin-icon',
		});
	}, []);

	useEffect(() => {
		initLeafletDefaultIcon();
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				setLoading(true);
				setError(null);

				const [structuresRes, locationsRes] = await Promise.all([
					fetch(API.structures),
					fetch(API.locations),
				]);

				if (!structuresRes.ok) {
					throw new Error(
						`Structures fetch failed: ${structuresRes.status} ${structuresRes.statusText}`,
					);
				}
				if (!locationsRes.ok) {
					throw new Error(
						`Locations fetch failed: ${locationsRes.status} ${locationsRes.statusText}`,
					);
				}

				const structuresJson = toArray<StructureRow>(
					await structuresRes.json(),
				);
				const locationsJson = toArray<LocationRow>(await locationsRes.json());

				if (cancelled) return;

				setStructures(structuresJson ?? []);
				setLocations(locationsJson ?? []);
			} catch (e) {
				if (cancelled) return;
				setError(
					e instanceof Error
						? e.message
						: 'Unknown error while loading map pins.',
				);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();

		return () => {
			cancelled = true;
		};
	}, []);

	const pins: Array<MapPin & { budget?: number | null }> = useMemo(() => {
		const locById = new Map<string, LocationRow>();
		for (const location of locations)
			locById.set(location.location_id, location);

		const mapped: Array<(MapPin & { budget?: number | null }) | null> =
			structures.map(
				(structure): (MapPin & { budget?: number | null }) | null => {
					if (
						typeof structure.name !== 'string' ||
						structure.name.trim().length === 0
					)
						return null;

					const typeNum =
						typeof structure.type === 'number'
							? structure.type
							: typeof structure.type === 'string'
								? Number(structure.type)
								: NaN;

					if (!Number.isFinite(typeNum)) return null;

					if (
						typeof structure.location_id !== 'string' ||
						structure.location_id.length === 0
					)
						return null;

					const location = locById.get(structure.location_id);
					if (!location) return null;

					const latitudeRaw = location.latitude;
					const longitudeRaw = location.longitude;

					const latitude =
						typeof latitudeRaw === 'string' ? Number(latitudeRaw) : latitudeRaw;
					const longitude =
						typeof longitudeRaw === 'string'
							? Number(longitudeRaw)
							: longitudeRaw;

					if (typeof latitude !== 'number' || !Number.isFinite(latitude))
						return null;
					if (typeof longitude !== 'number' || !Number.isFinite(longitude))
						return null;

					const budgetNum =
						typeof structure.budget === 'number'
							? structure.budget
							: typeof structure.budget === 'string'
								? Number(structure.budget)
								: null;

					return {
						structure_id: structure.structure_id,
						name: structure.name,
						type: typeNum,
						latitude,
						longitude,
						budget: Number.isFinite(budgetNum as number)
							? (budgetNum as number)
							: null,
					};
				},
			);

		return mapped.filter(
			(x): x is MapPin & { budget?: number | null } => x !== null,
		);
	}, [structures, locations]);

	return (
		<div className="mx-4 mt-12 mb-4 flex flex-1 items-center justify-center min-h-[770px] relative">
			<MapContainer
				center={center}
				zoom={zoom}
				style={{ height: '100%', width: '100%', zIndex: 10 }}
			>
				<BindMapRef mapRef={mapRef} />

				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<MarkerClusterGroup showCoverageOnHover={false} chunkedLoading>
					{pins.map(pin => (
						<Marker
							key={pin.structure_id}
							position={[pin.latitude, pin.longitude]}
							icon={projectIcon}
						>
							<Popup>
								<div className="min-w-[180px]">
									<div className="font-semibold text-lg">
										<Link to={`/projekty/${pin.structure_id}`}>{pin.name}</Link>
									</div>
									<div className="flex justify-between text-base">
										<div>{CATEGORIES[pin.type] ?? `Typ #${pin.type}`}</div>
										<div>{formatCzk(pin.budget as number)}</div>
									</div>
									<div className="text-gray-400 mt-3 text-md flex justify-center">
										{formatCoordinates(pin.latitude)} s. š.,&nbsp;
										{formatCoordinates(pin.longitude)} v. d.
									</div>
								</div>
							</Popup>
						</Marker>
					))}
				</MarkerClusterGroup>
			</MapContainer>

			<div className="absolute top-4 z-50 flex flex-col items-center">
				{loading && (
					<div className="bg-white rounded-full flex justify-center items-center w-[50px] h-[50px]">
						<Loader />
					</div>
				)}
				{error && (
					<div className="bg-red-700 rounded-xl text-white font-semibold px-3 py-2">
						Chyba: {error}
					</div>
				)}
			</div>
		</div>
	);
};

export default MapView;
