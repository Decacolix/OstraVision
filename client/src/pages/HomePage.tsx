import { useEffect, useMemo, useState } from 'react';
import UpdateListItem from '../projects/UpdateListItem';
import { API, fetchJson } from '../utils';
import Loader from '../layout/Loader';
import { useNavigate, type NavigateFunction } from 'react-router';
import type { UpdateRow } from '../types/UpdateRow';

/* Type representing a minimal structure record returned from the API. */
type StructureRow = {
	structure_id: string;
	name?: string;
	[key: string]: unknown;
};

/* Generic API list response shape used by backend list endpoints. */
type ListResponse<T> = {
	items: T[];
	total: number;
	limit: number | null;
	offset: number | null;
};

/* Number of latest updates to be displayed on the homepage. */
const UPDATES_LIMIT: number = 6;

/* Homepage component. */
const HomePage = () => {
	/* Holds the latest updates fetched from API. */
	const [updates, setUpdates] = useState<UpdateRow[]>([]);

	/* Holds names of structures to prevent repeated API calls for the same structure. */
	const [structureNames, setStructureNames] = useState<Record<string, string>>(
		{},
	);

	/* Loading and error state for spinners and error messages. */
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	/* Extracts unique structure IDs from updates. */
	const structureIds = useMemo<string[]>(() => {
		return Array.from(
			new Set(updates.map(update => update.structure_id).filter(Boolean)),
		);
	}, [updates]);

	/* Effect responsible for loading the latest updates from the API. Runs only once on component mount. */
	useEffect(() => {
		/* AbortController allows us to cancel the request if the component unmounts. */
		const controller: AbortController = new AbortController();

		const load = async (): Promise<void> => {
			/* Update UI state to show loading and clear any previous error. */
			setLoading(true);
			setError(null);

			/* Query parameters. */
			try {
				const params: URLSearchParams = new URLSearchParams({
					limit: String(UPDATES_LIMIT),
					offset: '0',
					order_by: 'update_date',
					order_dir: 'desc',
				});

				/* Fetch the update from the API. */
				const res: ListResponse<UpdateRow> = await fetchJson<
					ListResponse<UpdateRow>
				>(`${API.updates}?${params.toString()}`, controller.signal);

				/* Store fetched updates in the state. */
				setUpdates(res.items ?? []);
			} catch (error) {
				/* Ignore abort errors, as these happen normally when we cancel request. */
				if (!(error instanceof DOMException && error.name === 'AbortError')) {
					setError(
						error instanceof Error ? error.message : 'Failed to load updates.',
					);
				}
			} finally {
				/* Stop loading spinner. */
				setLoading(false);
			}
		};

		/* Load the updates data. */
		load();

		/* Cleanup: abort request if component unmounts. */
		return () => controller.abort();
	}, []);

	/* Effect responsible for resolving structure names. */
	useEffect(() => {
		/* If there are no structure IDs, abort the function. */
		if (structureIds.length === 0) return;

		/* AbortController allows us to cancel the request if the component unmounts. */
		const controller: AbortController = new AbortController();

		const loadNames = async (): Promise<null | undefined> => {
			try {
				const pairs: [string, string][] = await Promise.all(
					/* Fetch structure details in parallel for each structure ID. */
					structureIds.map(async id => {
						try {
							const row: StructureRow = await fetchJson<StructureRow>(
								`${API.structures}${id}`,
								controller.signal,
							);

							/* Return a tuple of structure ID and its name. */
							return [id, row?.name ?? ''] as const;
						} catch {
							/* If fetching a single structure fails, fall back to an empty name. */
							return [id, ''] as const;
						}
					}),
				);

				/* Merge newly fetched structure names into existing state. */
				setStructureNames(prev => {
					const next: { [x: string]: string } = { ...prev };
					for (const [id, name] of pairs) next[id] = name;
					return next;
				});
			} catch {
				/*Errors are intentionally ignored here, individual fetch failures are already handled above. */
				return null;
			}
		};

		/* Load the names. */
		loadNames();

		/* Cleanup: abort request if component unmounts or dependencies change. */
		return () => controller.abort();
	}, [structureIds]);

	/* Navigate to the project detail page. */
	const navigate: NavigateFunction = useNavigate();

	return (
		<div>
			<div className="text-left border-b-gray-400 border-b pb-3">
				<h1 className="text-3xl mb-4">
					PROPOJÍME RADNICI A DEVELOPERY S OSTRAVSKÝMI OBČANY!
				</h1>
				<div>
					<p className="my-3 text-xl">
						Představujeme Vám mapovou webovou aplikaci pro občany Ostravy, kteří
						chtějí vědět, co se v jejich městě zrovna staví, plánuje nebo
						otevírá.
					</p>
					<p className="my-3 text-xl">
						Najdete zde i nové ostravské přírůstky v rámci kultury a
						gastroscény.
					</p>
					<p className="my-3 text-xl">
						Do boudoucna máme v plánu vytvořit i katalog sportovišť napříč celým
						městem a jeho částmi.
					</p>
					<p className="my-3 text-xl">
						V tuto chvíli nespolupracujeme s žádnou organizací, firmou či
						institucí a vše děláme na vlastní triko.
					</p>
				</div>
			</div>
			<h2 className="font-bold text-lg text-left mt-6 pb-3 text-olb">
				NOVÉ AKTUALIZACE:
			</h2>
			<div className="max-h-[300px] overflow-y-scroll">
				{
					/*Error message – shown when API fetch fails. */
					error && <div className="font-bold">Chyba: {error}</div>
				}

				{
					/* Loader – shown while a fetch is running. */
					loading && (
						<div className="my-4">
							<Loader />
						</div>
					)
				}

				{
					/* Render each update as a list item. */
					updates.map(update => (
						<div key={update.update_id} className="mb-4 pr-4">
							<UpdateListItem
								update={update}
								title={structureNames[update.structure_id] ?? ''}
								showDaysAgo={true}
								onClick={() => navigate(`/projekty/${update.structure_id}`)}
							/>
						</div>
					))
				}

				{
					/* Empty state – shown when no updates are found and we're not loading. */ !loading &&
						!error &&
						updates.length === 0 && (
							<div className="font-bold">
								Žádné aktualizace nebyly nalezeny.
							</div>
						)
				}
			</div>
		</div>
	);
};

export default HomePage;
