/* A pin for the Leaflet map. */
export type MapPin = {
	structure_id: string;
	name: string;
	type: number;
	budget?: number | null;
	latitude: number;
	longitude: number;
};
