import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProjectSortBar, {
	type SortDirection,
	type SortType,
} from '../projects/ProjectSortBar';
import ProjectListItem, { type Structure } from '../projects/ProjectListItem';
import Loader from '../layout/Loader';
import { fetchJson, API } from '../utils';

/* Represents one row returned from the photo endpoint. */
type PhotoRow = {
	structure_id?: string;
	update_id?: string | null;
	photo_source?: string | null;
	[key: string]: unknown;
};

/* Generic shape of the list response returned by API. */
type ListResponse<T> = {
	items: T[];
	total: number;
	limit: number | null;
	offset: number | null;
};

/* How many structures are requsted at once. */
const LIMIT = 20;

const ProjectsPage = () => {
	/* Sorting UI state: sortType – decides which field we order by, sortDirection – decides between ascending and descending order. */
	const [sortType, setSortType] = useState<SortType>('time');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

	/* Loaded structures. */
	const [structures, setStructures] = useState<Structure[]>([]);

	/* Total number of matching structures in the database. */
	const [total, setTotal] = useState<number>(0);

	/* Current offset that was last successfully loaded. */
	const [offset, setOffset] = useState<number>(0);

	/* Cache of cover photo URLs by structure_id. Avoids refetching photos for already loaded items. */
	const [photosByStructureId, setPhotosByStructureId] = useState<
		Record<string, string | null>
	>({});

	/* Loading and error state for spinners and error messages. */
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	/* Sentinel element observed by IntersectionObserver. When it becomes visible, we attempt to load the next page. */
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	/* Holds the current AbortController so we can cancel ongoing requests. Important when user changes sorting quickly or when we start a new request before the old one finishes. */
	const abortRef = useRef<AbortController | null>(null);

	/* Decide which database coluimn to order by, based on sort type. */
	const orderBy = useMemo(
		() => (sortType === 'alphabetical' ? 'name' : 'updated_at'),
		[sortType]
	);

	/* Whether we still have more items to load. If structures.length < total, there are more results available. */
	const hasMore = useMemo(
		() => structures.length < total,
		[structures.length, total]
	);

	/* Fetch and cache cover photos for a batch of structures. For each structure, we query photos filtered by structure_id and we pick the first photo where update_id is null or undefined, to avoid using photos for updates. */
	const loadPhotosForStructures = async (
		items: Structure[],
		signal: AbortSignal
	) => {
		/* If there are no items, abort the function. */
		if (!items.length) return;

		/* For each structure, fetch related photos. */
		const pairs = await Promise.all(
			items.map(async structure => {
				try {
					/* Build query parameters for the photos endpoint. */
					const params = new URLSearchParams({
						structure_id: structure.structure_id,
						limit: '10',
						order_by: 'photo_date',
						order_dir: 'desc',
					});

					/* Fetch photos list response for this structure. */
					const res = await fetchJson<ListResponse<PhotoRow>>(
						`${API.photos}?${params.toString()}`,
						signal
					);

					/* Pick a cover photo that is not tied to an update. */
					const cover = res.items.find(
						photo => photo.update_id === null || photo.update_id === undefined
					);

					/* Return mapping pair: structure_id & photo_source. */
					return [structure.structure_id, cover?.photo_source ?? null] as const;
				} catch {
					/* If photo fetching fails, return an entry with null. */
					return [structure.structure_id, null] as const;
				}
			})
		);

		setPhotosByStructureId(prev => {
			const next = { ...prev };

			for (const [id, url] of pairs) next[id] = url;
			return next;
		});
	};

	/* In-flight guard prevents the same page from triggering multiple loads. This is separate from loading state to avoid re-render timing issues. */
	const inFlightRef = useRef(false);

	/* Load one page of structures based on offset. */
	const loadPage = useCallback(
		async (nextOffset: number) => {
			/* If a request is already running, ignore this call. */
			if (inFlightRef.current) return;
			inFlightRef.current = true;

			/* Update UI state to show loading and clear any previous error. */
			setLoading(true);
			setError(null);

			/* Abort previous request, if any, and create a fresh controller for this one. */
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			try {
				/* Build query parameters for the structures endpoint. Limit and offset are for pagination (infinite scroll). */
				const params = new URLSearchParams({
					limit: String(LIMIT),
					offset: String(nextOffset),
					order_by: orderBy,
					order_dir: sortDirection,
				});

				/* Fetch the structure page from the API. */
				const res = await fetchJson<ListResponse<Structure>>(
					`${API.structures}?${params.toString()}`,
					controller.signal
				);

				/* Store total count for pagination logic. */
				setTotal(res.total ?? 0);

				/* Update list: if nextOffset is 0, replace the list (fresh load), otherwise append. De-duplicate by structure_id to avoid duplicate keys. */
				setStructures(prev => {
					const merged = nextOffset === 0 ? res.items : [...prev, ...res.items];
					const byId = new Map(
						merged.map(structure => [structure.structure_id, structure])
					);
					return Array.from(byId.values());
				});

				/* Store the latest successfully loaded offset. */
				setOffset(nextOffset);

				/* Fetch cover photos for the new items (parallel request per structure). */
				await loadPhotosForStructures(res.items, controller.signal);
			} catch (error) {
				/* Ignore abort errors, as these happen normally when we cancel request. */
				if (!(error instanceof DOMException && error.name === 'AbortError')) {
					/* Store an error message. */
					setError(
						error instanceof Error ? error.message : 'Failed to load projects.'
					);
				}
			} finally {
				/* Mark request as finished, even if it failed, and stop loading spinner. */
				inFlightRef.current = false;
				setLoading(false);
			}
		},
		/* Dependencies: loadPage must refetch when ordering changes (new query parameters), so it depends on orderBy & sortDirection. */
		[orderBy, sortDirection]
	);

	/* Reset list state and load the first page again. Used when sortring changes, because we want a new dataset from the server. */
	const resetAndReload = useCallback(() => {
		/* Clear current items and photo cache. */
		setStructures([]);
		setPhotosByStructureId({});

		/* Reset pagination tracking. */
		setTotal(0);
		setOffset(0);

		/* Fetch the first page for the current sorting options. */
		loadPage(0);
	}, [loadPage]);

	/* When sorting changes, we recreate resetAndReload, this effect clears old results and loads the first page again with new ordering. */
	useEffect(() => {
		resetAndReload();
	}, [resetAndReload]);

	/* Infinite scrolling. Observe the sentinel element at the end of the list. When it comes near the viewport, load the next page if there are more items and we are currently not loading. */
	useEffect(() => {
		const element = sentinelRef.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			entries => {
				/* Use the first observer entry. We observer only one element. */
				if (entries[0]?.isIntersecting && hasMore && !loading) {
					/* Request the next page by increasing offset by LIMIT. */
					loadPage(offset + LIMIT);
				}
			},
			/* The rootMargin loads earlier, 200px before reaching the end, for smoother UX. */
			{ rootMargin: '200px' }
		);

		/* Start observing. */
		observer.observe(element);

		/* Cleanup when dependencies change. */
		return () => observer.disconnect();
	}, [hasMore, loading, offset, loadPage]);

	return (
		<div className="w-full">
			{
				/* Sort bar is hidden when there is an error. */
				!error && (
					<ProjectSortBar
						sortType={sortType}
						sortDirection={sortDirection}
						onChangeSortType={setSortType}
						onChangeSortDirection={setSortDirection}
						disabled={loading}
					/>
				)
			}

			<div className="max-h-[750px] overflow-y-scroll pr-4">
				{
					/* Render each structure as a list item. */
					structures.map(structure => (
						<div id={structure.structure_id} key={structure.structure_id}>
							<ProjectListItem
								key={structure.structure_id}
								structure={structure}
								photoUrl={photosByStructureId[structure.structure_id]}
								lastUpdatedLabel={structure.updated_at ?? ''}
								onClick={() => {}}
							/>
						</div>
					))
				}

				{
					/*Error message – shown when API fetch fails. */
					error && <div className="m-4 font-bold">Chyba: {error}</div>
				}

				{
					/* Loader – shown while a fetch is running. */
					loading && (
						<div className="m-4">
							<Loader />
						</div>
					)
				}

				{
					/* Empty state – shown when no projects are found and we're not loading. */
					!loading && !error && structures.length === 0 && (
						<div className="m-4 font-bold">Nebyly nalezeny žádné projekty.</div>
					)
				}

				<div ref={sentinelRef} className="h-1 w-full" />
			</div>
		</div>
	);
};

export default ProjectsPage;
