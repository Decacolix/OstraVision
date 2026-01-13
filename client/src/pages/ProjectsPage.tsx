import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProjectSortBar, {
	type SortDirection,
	type SortType,
} from '../projects/ProjectSortBar';
import ProjectListItem, { type Structure } from '../projects/ProjectListItem';
import Loader from '../layout/Loader';
import { fetchJson, API } from '../utils';
import FilterButton from '../projects/FilterButton';
import FilterCard from '../projects/FilterCard';
import SearchBar from '../projects/SearchBar';
import { useNavigate, type NavigateFunction } from 'react-router';

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
const LIMIT: number = 20;

const parseBudget = (value: unknown): number => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
	if (typeof value === 'string') {
		const n: number = Number(value);
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
};

/* Projects page component: renders the whole page with projects. */
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
	const orderBy = useMemo<'name' | 'updated_at'>(
		() => (sortType === 'alphabetical' ? 'name' : 'updated_at'),
		[sortType]
	);

	/* Whether we still have more items to load. If structures.length < total, there are more results available. */
	const hasMore = useMemo<boolean>(
		() => structures.length < total,
		[structures.length, total]
	);

	/* Fetch and cache cover photos for a batch of structures. For each structure, we query photos filtered by structure_id and we pick the first photo where update_id is null or undefined, to avoid using photos for updates. */
	const loadPhotosForStructures = async (
		items: Structure[],
		signal: AbortSignal
	): Promise<void> => {
		/* If there are no items, abort the function. */
		if (!items.length) return;

		/* For each structure, fetch related photos. */
		const pairs: [string, string | null][] = await Promise.all(
			items.map(async structure => {
				try {
					/* Build query parameters for the photos endpoint. */
					const params: URLSearchParams = new URLSearchParams({
						structure_id: structure.structure_id,
						limit: '10',
						order_by: 'photo_date',
						order_dir: 'desc',
					});

					/* Fetch photos list response for this structure. */
					const res: ListResponse<PhotoRow> = await fetchJson<
						ListResponse<PhotoRow>
					>(`${API.photos}?${params.toString()}`, signal);

					/* Pick a cover photo that is not tied to an update. */
					const cover: PhotoRow | undefined = res.items.find(
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
			const next: {
				[x: string]: string | null;
			} = { ...prev };

			for (const [id, url] of pairs) next[id] = url;
			return next;
		});
	};

	/* In-flight guard prevents the same page from triggering multiple loads. This is separate from loading state to avoid re-render timing issues. */
	const inFlightRef = useRef<boolean>(false);

	/* Load one page of structures based on offset. */
	const loadPage = useCallback<(nextOffset: number) => Promise<void>>(
		async (nextOffset: number): Promise<void> => {
			/* If a request is already running, ignore this call. */
			if (inFlightRef.current) return;
			inFlightRef.current = true;

			/* Update UI state to show loading and clear any previous error. */
			setLoading(true);
			setError(null);

			/* Abort previous request, if any, and create a fresh controller for this one. */
			abortRef.current?.abort();
			const controller: AbortController = new AbortController();
			abortRef.current = controller;

			try {
				/* Build query parameters for the structures endpoint. Limit and offset are for pagination (infinite scroll). */
				const params: URLSearchParams = new URLSearchParams({
					limit: String(LIMIT),
					offset: String(nextOffset),
					order_by: orderBy,
					order_dir: sortDirection,
				});

				/* Fetch the structure page from the API. */
				const res: ListResponse<Structure> = await fetchJson<
					ListResponse<Structure>
				>(`${API.structures}?${params.toString()}`, controller.signal);

				/* Store total count for pagination logic. */
				setTotal(res.total ?? 0);

				/* Update list: if nextOffset is 0, replace the list (fresh load), otherwise append. De-duplicate by structure_id to avoid duplicate keys. */
				setStructures(prev => {
					const merged: Structure[] =
						nextOffset === 0 ? res.items : [...prev, ...res.items];
					const byId: Map<string, Structure> = new Map(
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
	const resetAndReload = useCallback<() => void>(() => {
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
		const element: HTMLDivElement | null = sentinelRef.current;
		if (!element) return;

		const observer: IntersectionObserver = new IntersectionObserver(
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

	/* Filter UI state, filtersOpen controls whether the filter card is expanded/collapsed. */
	const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

	/* Search state, filters projects by name. */
	const [searchText, setSearchText] = useState<string>('');

	/* Selected category indices (multi-select). These map directly to CATEGORIES and structure.type numeric values. */
	const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

	/* Compute the largest budget value from the currently loaded structures. Used as the slider's upper bound. */
	const absoluteMaxBudget = useMemo<number>(() => {
		if (!structures.length) return 0;
		return Math.max(
			...structures.map(structure => parseBudget(structure.budget))
		);
	}, [structures]);

	/* Budget range filter state. Defaults are [0, absoluteMaxBudget]. */
	const [minBudget, setMinBudget] = useState<number>(0);
	const [maxBudget, setMaxBudget] = useState<number>(absoluteMaxBudget);

	/* Track the previous absoluteMaxBudget so we can detect whether the user "stays at max" while data loads. */
	const prevAbsMaxRef = useRef<number>(0);

	/* Keep the maxBudget aligned with absoluteMaxBudget when the user hasn't manually reduced it. */
	useEffect(() => {
		const prev: number = prevAbsMaxRef.current;

		/* If user was previously at max (or max was still 0), treat it as "auto" and keep updating it. */
		const userIsAtMax: boolean = maxBudget === prev || maxBudget === 0;

		/* When the dataset grows and max increases, keep the user's max pinned to the new top (only if user didn't set custom max). */
		if (userIsAtMax) setMaxBudget(absoluteMaxBudget);

		/* If min is now above the new absolute max (e.g., data changed), reset it to 0 to keep filters valid. */
		if (minBudget > absoluteMaxBudget) setMinBudget(0);

		/* Store current max for the next comparison. */
		prevAbsMaxRef.current = absoluteMaxBudget;
	}, [absoluteMaxBudget, minBudget, maxBudget]);

	/* Decide whether filters are currently active, used for button styling and showing the reset icon. */
	const hasActiveFilters = useMemo<boolean>(() => {
		const categoriesActive: boolean = selectedCategories.length > 0;

		/* Budget filter is active if min > 0 OR the user reduced max below the current absolute maximum. */
		const budgetActive: boolean =
			minBudget > 0 || (absoluteMaxBudget > 0 && maxBudget < absoluteMaxBudget);

		return categoriesActive || budgetActive;
	}, [selectedCategories.length, minBudget, maxBudget, absoluteMaxBudget]);

	/* Reset filters back to defaults. */
	const resetFilters = useCallback<() => void>(() => {
		setSelectedCategories([]);
		setMinBudget(0);

		/* Reset max to the current dataset max. */
		setMaxBudget(absoluteMaxBudget);
	}, [absoluteMaxBudget]);

	/* Toggle a single category index on/off in the selectedCategories array. */
	const toggleCategory = useCallback<(idx: number) => void>((idx: number) => {
		setSelectedCategories(prev =>
			prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
		);
	}, []);

	/* Apply filters to the already-loaded structures, client-side filtering, no extra API calls. */
	const filteredStructures = useMemo<Structure[]>(() => {
		const categorySet: Set<number> = new Set(selectedCategories);
		const query: string = searchText.trim().toLowerCase();

		return structures.filter(structure => {
			/* Category filter: if none selected, allow all; otherwise require structure.type to be selected. */
			const typeValue: number =
				typeof structure.type === 'number' ? structure.type : -1;
			const categoryOk: boolean =
				categorySet.size === 0 ? true : categorySet.has(typeValue);

			/* Budget filter: parse budget and keep only values within [minBudget, maxBudget]. */
			const budget: number = parseBudget(structure.budget);
			const budgetOk: boolean = budget >= minBudget && budget <= maxBudget;

			/* Search filter: case-insensitive substring match on name. */
			const name: string =
				typeof structure.name === 'string' ? structure.name : '';
			const searchOk: boolean =
				query.length === 0 ? true : name.toLowerCase().includes(query);

			return categoryOk && budgetOk && searchOk;
		});
	}, [structures, selectedCategories, minBudget, maxBudget, searchText]);

	/* Navigate to the project detail page. */
	const navigate: NavigateFunction = useNavigate();

	return (
		<div className="w-full max-h-[750px] overflow-y-scroll ">
			{
				/* Sort bar is hidden when there is an error. */
				!error && (
					<div className="flex flex-col pr-4">
						{/* Filters button row. */}
						<div className="flex items-center justify-between">
							<FilterButton
								hasActiveFilters={hasActiveFilters}
								onToggle={() => setFiltersOpen(v => !v)}
								onReset={resetFilters}
								disabled={false}
							/>
							<SearchBar
								value={searchText}
								onChange={setSearchText}
								disabled={false}
							/>
						</div>

						{/* Collapsible filters card (categories + budget range). */}
						<FilterCard
							isOpen={filtersOpen}
							selectedCategories={selectedCategories}
							onToggleCategory={toggleCategory}
							minBudget={minBudget}
							maxBudget={maxBudget}
							absoluteMaxBudget={absoluteMaxBudget}
							onChangeMinBudget={setMinBudget}
							onChangeMaxBudget={setMaxBudget}
						/>

						{/* Sort bar stays below filters for a clean UI hierarchy. */}
						<div className="mt-4">
							<ProjectSortBar
								sortType={sortType}
								sortDirection={sortDirection}
								onChangeSortType={setSortType}
								onChangeSortDirection={setSortDirection}
								disabled={loading}
							/>
						</div>
					</div>
				)
			}

			<div className="pr-4">
				{
					/* Render each structure as a list item. */
					filteredStructures.map(structure => (
						<div id={structure.structure_id} key={structure.structure_id}>
							<ProjectListItem
								key={structure.structure_id}
								structure={structure}
								photoUrl={photosByStructureId[structure.structure_id]}
								lastUpdatedLabel={structure.updated_at ?? ''}
								onClick={() => navigate(`/projekty/${structure.structure_id}`)}
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
					!loading && !error && filteredStructures.length === 0 && (
						<div className="m-4 font-bold">Nebyly nalezeny žádné projekty.</div>
					)
				}

				<div ref={sentinelRef} className="h-1 w-full" />
			</div>
		</div>
	);
};

export default ProjectsPage;
