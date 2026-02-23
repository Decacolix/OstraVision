/* Exported type representing one project record from the API. */
export type StructureRow = {
	structure_id: string;
	name?: string;
	description?: string;
	type?: number;
	budget?: number;
	updated_at?: string;
	location_id?: string | null;
	[key: string]: unknown;
};
