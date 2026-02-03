/* Photo record returned from /photos (filtered by structure_id). */
export type PhotoRow = {
	photo_id?: string;
	structure_id?: string;
	update_id?: string | null;
	photo_source?: string | null;
	photo_date?: string | null;
	photo_description?: string | null;
	photo_author?: string | null;
	[key: string]: unknown;
};
