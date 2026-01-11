import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import Loader from '../layout/Loader';
import { API, CATEGORIES, fetchJson, truncateText } from '../utils';
import { formatCzk } from '../utils/formatCzk';
import Gallery from '../layout/Gallery';

type ListResponse<T> = {
	items: T[];
	total: number;
	limit: number | null;
	offset: number | null;
};

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
	[key: string]: unknown;
};

type UpdateRow = {
	update_id: string;
	structure_id: string;
	update_date?: string;
	update_text?: string;
	[key: string]: unknown;
};

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

type EntityRow = {
	investor_id?: string;
	contractor_id?: string;
	author_id?: string;
	name?: string;
	description?: string;
	source?: string;
	[key: string]: unknown;
};

type WriterRow = {
	writer_id?: string;
	writer_name?: string;
	writer_text?: string;
	writer_link?: string;
	writer_photo?: string;
	[key: string]: unknown;
};

type SourceRow = {
	source_id?: string;
	source_name?: string;
	source_link?: string;
	[key: string]: unknown;
};

type DetailData = {
	structure: StructureDetail | null;
	updates: ListResponse<UpdateRow> | null;
	photos: ListResponse<PhotoRow> | null;
	investor: EntityRow | null;
	contractor: EntityRow | null;
	author: EntityRow | null;
	writer: WriterRow | null;
	source: SourceRow | null;
};

const fetchById = async <T,>(
	baseUrl: string,
	entityId: unknown,
	controller: AbortController
): Promise<T | null> => {
	if (typeof entityId !== 'string' || !entityId.trim()) return null;
	try {
		return await fetchJson<T>(`${baseUrl}${entityId}`, controller.signal);
	} catch {
		return null;
	}
};

const ProjectDetailPage = () => {
	const { id } = useParams<{ id: string }>();

	const [data, setData] = useState<DetailData>({
		structure: null,
		updates: null,
		photos: null,
		investor: null,
		contractor: null,
		author: null,
		writer: null,
		source: null,
	});

	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const safeId = useMemo<string>(
		() => (typeof id === 'string' ? id.trim() : ''),
		[id]
	);

	useEffect(() => {
		if (!safeId) {
			setError('Chybí ID projektu v URL.');
			return;
		}

		const controller: AbortController = new AbortController();

		const load = async (): Promise<void> => {
			setLoading(true);
			setError(null);

			try {
				const structure: StructureDetail = await fetchJson<StructureDetail>(
					`${API.structures}${safeId}`,
					controller.signal
				);

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

				const [investor, contractor, author, writer, source] =
					await Promise.all([
						fetchById<EntityRow>(
							API.investors,
							structure.investor_id,
							controller
						),
						fetchById<EntityRow>(
							API.contractors,
							structure.contractor_id,
							controller
						),
						fetchById<EntityRow>(API.authors, structure.author_id, controller),
						fetchById<WriterRow>(API.writers, structure.writer_id, controller),
						fetchById<SourceRow>(API.sources, structure.source_id, controller),
					]);

				setData({
					structure,
					updates,
					photos,
					investor,
					contractor,
					author,
					writer,
					source,
				});
			} catch (error) {
				if (!(error instanceof DOMException && error.name === 'AbortError')) {
					setError(
						error instanceof Error ? error.message : 'Failed to load project.'
					);
				}
			} finally {
				setLoading(false);
			}
		};

		load();

		return () => controller.abort();
	}, [safeId]);

	const typeIndex =
		typeof data.structure?.type === 'number' ? data.structure.type : -1;
	const categoryLabel =
		typeIndex >= 0 && typeIndex < CATEGORIES.length
			? CATEGORIES[typeIndex]
			: '';

	return (
		<div className="w-full max-h-[750px] overflow-y-scroll text-left">
			{error && <div className="m-4 font-bold text-center">Chyba: {error}</div>}

			{loading && (
				<div className="my-4 text-center">
					<Loader />
				</div>
			)}

			{!error && !loading && (
				<div className=" w-full px-4">
					<div className="flex justify-between gap-4 mb-6">
						{categoryLabel && (
							<div
								className="rounded-lg text-center w-1/2 bg-odb text-white text-lg py-1 font-medium"
								title="Kategorie"
							>
								{CATEGORIES[data.structure?.type as number]?.toUpperCase() ??
									''}
							</div>
						)}
						{data.structure?.budget && (
							<div
								className="rounded-lg text-center w-1/2 bg-olb text-white text-lg py-1 font-medium"
								title="Rozpočet"
							>
								{formatCzk(data.structure?.budget as number) ?? ''}
							</div>
						)}
					</div>
					<div className="flex items-start">
						<div className="w-[70%] pr-2 border-r border-odb">
							<h1 className="text-2xl font-bold wrap-anywhere">
								{data.structure?.name}
							</h1>
							<p className="mt-4 leading-7 wrap-anywhere">
								{data.structure?.description}
							</p>
						</div>
						<div className="w-[30%] pl-2 border-l border-odb -ml-px">
							{data.investor?.investor_id && (
								<div className="flex flex-col items-center mb-4">
									<img
										src="/src/assets/icons/investor-icon-lb.svg"
										alt="investor"
										className="w-20 mb-2"
										title="Investor"
									/>
									<div className="text-center">
										<a
											href={data.investor?.source ?? '/'}
											target="_blank"
											rel="noreferrer noopener"
											className={[
												'font-bold hover:text-olb wrap-anywhere',
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
												80
											)}
										</p>
									</div>
								</div>
							)}

							{data.contractor?.contractor_id && (
								<div className="flex flex-col items-center mb-4">
									<img
										src="/src/assets/icons/contractor-icon-lb.svg"
										alt="contractor"
										className="w-20 mb-2"
										title="Kontraktor"
									/>
									<div className="text-center">
										<a
											href={data.contractor?.source ?? '/'}
											target="_blank"
											rel="noreferrer noopener"
											className={[
												'font-bold hover:text-olb wrap-anywhere',
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
												80
											)}
										</p>
									</div>
								</div>
							)}

							{data.author?.author_id && (
								<div className="flex flex-col items-center">
									<img
										src="/src/assets/icons/author-icon-lb.svg"
										alt="author"
										className="w-20 mb-2"
										title="Autor"
									/>
									<div className="text-center">
										<a
											href={data.author?.source ?? '/'}
											target="_blank"
											rel="noreferrer noopener"
											className={[
												'font-bold hover:text-olb wrap-anywhere',
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
												80
											)}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="mt-5">
						<Gallery photos={data.photos?.items ?? []} />
					</div>
				</div>
			)}
		</div>
	);
};

export default ProjectDetailPage;
