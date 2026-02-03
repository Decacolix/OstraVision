/* Location information for a structure. */
export type LocationRow = {
	location_id: string;
	street?: string | null;
	house_number?: string | null;
	postal_code?: string | null;
	city?: string | null;
	urban_district?: string | null;
	[key: string]: unknown;
};
