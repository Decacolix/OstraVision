import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import Loader from '../layout/Loader';
import { API, CATEGORIES, fetchJson, truncateText } from '../utils';
import { formatCzk } from '../utils/formatCzk';
import Gallery from '../layout/Gallery';
import Timeline from '../layout/Timeline';
import UpdateListItem from '../projects/UpdateListItem';
import { formatDate } from '../utils/formatDate';
import { formatDomain } from '../utils/formatDomain';
import type { LocationRow } from '../types/LocationRow';
import { formatLocation } from '../utils/formatLocation';
import type { PhotoRow } from '../types/PhotoRow';

/* Generic API list response shape used by backend list endpoints. */
type ListResponse<T> = {
	items: T[];
	total: number;
	limit: number | null;
	offset: number | null;
};

/* Detailed structure record returned from /structures/:id. */
type StructureDetail = {
	structure_id: string;
	name?: string;
	description?: string;
	type?: number;
	budget?: number;
	timeline?: string;
	updated_at?: string;
	created_at?: string;
	investor_id?: string | null;
	contractor_id?: string | null;
	author_id?: string | null;
	writer_id?: string | null;
	source_id?: string | null;
	location_id?: string | null;
	[key: string]: unknown;
};

/* Update record returned from /updates (filtered by structure_id). */
type UpdateRow = {
	update_id: string;
	structure_id: string;
	update_date?: string;
	update_text?: string;
	[key: string]: unknown;
};

/* Common entity record used for investor/contractor/author endpoints. */
type EntityRow = {
	investor_id?: string;
	contractor_id?: string;
	author_id?: string;
	name?: string;
	description?: string;
	source?: string;
	[key: string]: unknown;
};

/* Writer record returned from /writers/:id. */
type WriterRow = {
	writer_id?: string;
	writer_name?: string;
	writer_text?: string;
	writer_link?: string;
	writer_photo?: string;
	[key: string]: unknown;
};

/* Source record returned from /sources/:id. */
type SourceRow = {
	source_id?: string;
	source_name?: string;
	source_link?: string;
	[key: string]: unknown;
};

/* Aggregated detail page data. Loaded in one effect and rendered together. */
type DetailData = {
	structure: StructureDetail | null;
	updates: ListResponse<UpdateRow> | null;
	photos: ListResponse<PhotoRow> | null;
	investor: EntityRow | null;
	contractor: EntityRow | null;
	author: EntityRow | null;
	writer: WriterRow | null;
	source: SourceRow | null;
	location: LocationRow | null;
};

/* Helper: fetch one entity by ID (or return null if ID is missing/invalid or the call fails). */
const fetchById = async <T,>(
	baseUrl: string,
	entityId: unknown,
	controller: AbortController,
): Promise<T | null> => {
	/* Validate the ID (some foreign keys are nullable). */
	if (typeof entityId !== 'string' || !entityId.trim()) return null;

	try {
		/* Use AbortController so all requests get cancelled on unmount / ID change. */
		return await fetchJson<T>(`${baseUrl}${entityId}`, controller.signal);
	} catch {
		/* Intentionally swallow errors for optional entities: the page still renders without them. */
		return null;
	}
};

/* Project detail page component: shows project detail information. */
const ProjectDetailPage = () => {
	/* Read the project ID from the /projekty/:id URL. */
	const { id } = useParams<{ id: string }>();

	/* Data bucket for everything this page needs. */
	const [data, setData] = useState<DetailData>({
		structure: null,
		updates: null,
		photos: null,
		investor: null,
		contractor: null,
		author: null,
		writer: null,
		source: null,
		location: null,
	});

	/* Loading and error state for spinners and error messages. */
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	/* Normalize the route param so we never send whitespace to the API. */
	const safeId = useMemo<string>(
		() => (typeof id === 'string' ? id.trim() : ''),
		[id],
	);

	/* Load everything needed for this structure when the URL ID changes. */
	useEffect(() => {
		/* If there is no ID in URL, show a user-friendly error. */
		if (!safeId) {
			setError('Chybí ID projektu v URL.');
			return;
		}

		/* AbortController cancels in-flight requests when component unmounts or safeId changes. */
		const controller: AbortController = new AbortController();

		const load = async (): Promise<void> => {
			/* Start loading and clear old errors. */
			setLoading(true);
			setError(null);

			try {
				/* Load the main structure detail. */
				const structure: StructureDetail = await fetchJson<StructureDetail>(
					`${API.structures}${safeId}`,
					controller.signal,
				);

				/* Load updates for this structure (newest first). */
				const updatesParams: URLSearchParams = new URLSearchParams({
					structure_id: safeId,
					limit: '100',
					offset: '0',
					order_by: 'update_date',
					order_dir: 'desc',
				});

				const updates: ListResponse<UpdateRow> = await fetchJson<
					ListResponse<UpdateRow>
				>(`${API.updates}?${updatesParams.toString()}`, controller.signal);

				/* Load photos for this structure (both project photos and update photos). */
				const photosParams: URLSearchParams = new URLSearchParams({
					structure_id: safeId,
					limit: '200',
					offset: '0',
					order_by: 'photo_date',
					order_dir: 'desc',
				});

				const photos: ListResponse<PhotoRow> = await fetchJson<
					ListResponse<PhotoRow>
				>(`${API.photos}?${photosParams.toString()}`, controller.signal);

				/* Load related entities in parallel (nullable foreign keys). */
				const [investor, contractor, author, writer, source, location] =
					await Promise.all([
						fetchById<EntityRow>(
							API.investors,
							structure.investor_id,
							controller,
						),
						fetchById<EntityRow>(
							API.contractors,
							structure.contractor_id,
							controller,
						),
						fetchById<EntityRow>(API.authors, structure.author_id, controller),
						fetchById<WriterRow>(API.writers, structure.writer_id, controller),
						fetchById<SourceRow>(API.sources, structure.source_id, controller),
						fetchById<LocationRow>(
							API.locations,
							structure.location_id,
							controller,
						),
					]);

				/* Store everything together so render stays simple. */
				setData({
					structure,
					updates,
					photos,
					investor,
					contractor,
					author,
					writer,
					source,
					location,
				});
			} catch (error) {
				/* Ignore abort errors: these happen when safeId changes or component unmounts. */
				if (!(error instanceof DOMException && error.name === 'AbortError')) {
					setError(
						error instanceof Error ? error.message : 'Failed to load project.',
					);
				}
			} finally {
				/* Stop spinner in all cases. */
				setLoading(false);
			}
		};

		/* Trigger the async load. */
		load();

		/* Cleanup: abort requests if we navigate away or safeId changes quickly. */
		return () => controller.abort();
	}, [safeId]);

	/* Compute the category label from structure.type (guards against missing/invalid values). */
	const typeIndex: number =
		typeof data.structure?.type === 'number' ? data.structure.type : -1;
	const categoryLabel: string =
		typeIndex >= 0 && typeIndex < CATEGORIES.length
			? CATEGORIES[typeIndex]
			: '';

	/* Build a lookup map: update_id to array of photos belonging to that update. This lets each update render its own Gallery. */
	const photosByUpdateId = useMemo<Record<string, PhotoRow[]>>(() => {
		const map: Record<string, PhotoRow[]> = {};
		const all: PhotoRow[] = data.photos?.items ?? [];

		for (const photo of all) {
			/* Skip photos without a URL (can't be displayed). */
			if (!photo?.photo_source) continue;

			/* Only update photos have update_id set (project gallery uses update_id null/undefined). */
			if (typeof photo.update_id !== 'string' || !photo.update_id.trim())
				continue;

			(map[photo.update_id] ??= []).push(photo);
		}

		return map;
	}, [data.photos?.items]);

	/* Build a location label for the displayed structure. */
	const locationLabel = useMemo<string>(() => {
		return data.location ? formatLocation(data.location) : '';
	}, [data.location]);

	/* Build a location link to the Google Maps. */
	const googleMapsHref = useMemo<string>(() => {
		if (!locationLabel) return '';
		return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
			locationLabel,
		)}`;
	}, [locationLabel]);

	return (
		<div className="w-full max-h-[750px] overflow-y-scroll text-left">
			{
				/* Error state. */
				error && <div className="m-4 font-bold text-center">Chyba: {error}</div>
			}

			{
				/* Loading state. */
				loading && (
					<div className="my-4 text-center">
						<Loader />
					</div>
				)
			}

			{
				/* Main content (only when not loading and no error). */
				!error && !loading && (
					<div className=" w-full px-4">
						<div className="flex">
							{
								/* Location label. */
								locationLabel && googleMapsHref && (
									<div>
										<a
											href={googleMapsHref}
											target="_blank"
											rel="noreferrer noopener"
											className="my-3 flex items-center text-odb hover:text-olb wrap-anywhere group"
											title="Otevřít v Google Maps"
										>
											{/* Default icon */}
											<img
												src="/src/assets/icons/location-icon-odb.svg"
												alt="location"
												className="mr-2 block group-hover:hidden"
												width={15}
											/>

											{/* Hover icon */}
											<img
												src="/src/assets/icons/location-icon-olb.svg"
												alt="location"
												className="mr-2 hidden group-hover:block"
												width={15}
											/>
											{locationLabel}
										</a>
									</div>
								)
							}
						</div>
						<div className="flex justify-between gap-4 mb-6">
							{
								/* Category label. */
								categoryLabel && (
									<div
										className="rounded-lg text-center w-1/2 bg-odb text-white text-lg py-1 font-medium"
										title="Kategorie"
									>
										{CATEGORIES[
											data.structure?.type as number
										]?.toUpperCase() ?? ''}
									</div>
								)
							}
							{
								/* Budget label. */
								data.structure?.budget && (
									<div
										className="rounded-lg text-center w-1/2 bg-olb text-white text-lg py-1 font-medium"
										title="Rozpočet"
									>
										{formatCzk(data.structure?.budget as number) ?? ''}
									</div>
								)
							}
						</div>
						{/* Main info row: left = name and description, right = entities. */}
						<div className="flex flex-col sm:flex-row">
							{/* Left column: structure name and description. */}
							<div
								className={[
									'pb-3 sm:pb-0 pr-2 border-odb flex flex-col justify-between',
									data.investor?.investor_id ||
									data.contractor?.contractor_id ||
									data.author?.author_id
										? 'w-full sm:w-[70%] border-0 sm:border-r'
										: 'w-full border-0',
								].join(' ')}
							>
								<div>
									<h1 className="text-2xl font-bold wrap-anywhere">
										{data.structure?.name}
									</h1>

									<p className="mt-4 leading-7 wrap-anywhere">
										{data.structure?.description}
									</p>
								</div>
								<div className="mt-4">
									<span className="font-semibold">Zdroj: </span>
									<a
										href={data.source?.source_link}
										target="_blank"
										className="text-odb hover:text-olb"
										title={data.source?.source_name}
									>
										{formatDomain(data.source?.source_link)}
									</a>
								</div>
							</div>
							{/* Right column: investor / contractor / author cards. */}
							{(data.investor?.investor_id ||
								data.contractor?.contractor_id ||
								data.author?.author_id) && (
								<div className="flex pt-3 sm:pt-0 flex-col sm:w-[30%] pl-2 border-t sm:border-l sm:border-t-0 border-odb sm:-ml-px self-center">
									{
										/* Investor block (render only when investor exists). */
										data.investor?.investor_id && (
											<div className="flex flex-col items-center mb-4">
												<img
													src="/src/assets/icons/investor-icon-lb.svg"
													alt="investor"
													className="w-15 sm:w-20 mb-2"
													title="Investor"
												/>
												<div className="text-center">
													<a
														href={data.investor?.source ?? '/'}
														target="_blank"
														rel="noreferrer noopener"
														className={[
															'font-bold hover:text-olb wrap-anywhere text-md',
															data.investor?.source
																? 'underline'
																: 'pointer-events-none',
														].join(' ')}
													>
														{data.investor?.name ?? ''}
													</a>
													<p
														className="text-sm wrap-anywhere"
														title={data.investor?.description}
													>
														{truncateText(
															(data.investor?.description as string) ?? '',
															80,
														)}
													</p>
												</div>
											</div>
										)
									}

									{
										/* Contractor block (render only when contractor exists). */
										data.contractor?.contractor_id && (
											<div className="flex flex-col items-center mb-4">
												<img
													src="/src/assets/icons/contractor-icon-lb.svg"
													alt="contractor"
													className="w-15 sm:w-20 mb-2"
													title="Kontraktor"
												/>
												<div className="text-center">
													<a
														href={data.contractor?.source ?? '/'}
														target="_blank"
														rel="noreferrer noopener"
														className={[
															'font-bold hover:text-olb wrap-anywhere text-md',
															data.contractor?.source
																? 'underline'
																: 'pointer-events-none',
														].join(' ')}
													>
														{data.contractor?.name ?? ''}
													</a>
													<p
														className="text-sm wrap-anywhere"
														title={data.contractor?.description}
													>
														{truncateText(
															(data.contractor?.description as string) ?? '',
															80,
														)}
													</p>
												</div>
											</div>
										)
									}

									{
										/* Author block (render only when author exists). */
										data.author?.author_id && (
											<div className="flex flex-col items-center">
												<img
													src="/src/assets/icons/author-icon-lb.svg"
													alt="author"
													className="w-15 sm:w-20 mb-2"
													title="Autor"
												/>
												<div className="text-center">
													<a
														href={data.author?.source ?? '/'}
														target="_blank"
														rel="noreferrer noopener"
														className={[
															'font-bold hover:text-olb wrap-anywhere text-md',
															data.author?.source
																? 'underline'
																: 'pointer-events-none',
														].join(' ')}
													>
														{data.author?.name ?? ''}
													</a>
													<p
														className="text-sm wrap-anywhere"
														title={data.author?.description}
													>
														{truncateText(
															(data.author?.description as string) ?? '',
															80,
														)}
													</p>
												</div>
											</div>
										)
									}
								</div>
							)}
						</div>

						{
							/* Project gallery: uses only photos where update_id is null/undefined (handled inside Gallery). */
							(data.photos?.items ?? []).length === 0 ? (
								''
							) : (
								<div className="mt-6 border-t border-gray-200 pt-6">
									<h2 className="text-2xl font-semibold mb-4">Galerie</h2>
									<Gallery photos={data.photos?.items ?? []} size="sm" />
								</div>
							)
						}

						{
							/* Timeline: render only when timeline exists (Timeline component also validates the format). */
							data.structure?.timeline === null ||
							data.structure?.timeline === undefined ||
							!data.structure?.timeline ? (
								''
							) : (
								<div className="mt-6 border-t border-gray-200 pt-6">
									<h2 className="text-2xl font-semibold mb-4">Časová osa</h2>
									<Timeline timeline={data.structure?.timeline} />
								</div>
							)
						}

						{
							/* Updates list: each update shows its own photos (only those with matching update_id). */
							(data.updates?.items ?? []).length === 0 ? (
								''
							) : (
								<div className="mt-6 border-t border-gray-200 pt-6">
									<div className="flex flex-col">
										<h2 className="text-2xl font-semibold mb-4">Aktualizace</h2>
										{(data.updates?.items ?? []).map(update => (
											<div
												key={update.update_id}
												className="border-dotted border-b-2 border-gray-300 pb-6 last-of-type:border-0 mb-6"
											>
												<UpdateListItem
													update={update}
													title={
														formatDate(update.update_date ?? '') ||
														'Aktualizace'
													}
													showDaysAgo={false}
													photos={photosByUpdateId[update.update_id] ?? []}
													gallerySize="sm"
												/>
											</div>
										))}
									</div>
								</div>
							)
						}
					</div>
				)
			}
		</div>
	);
};

export default ProjectDetailPage;
