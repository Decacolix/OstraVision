import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { formatDate } from '../utils/formatDate';
import type { PhotoRow } from '../projects/ProjectDetailPage';
import { formatDomain } from '../utils/formatDomain';

/* Gallery size: sm (small), md (medium), lg (large). */
type GallerySize = 'sm' | 'md' | 'lg';

/* Gallery content variant: structure (only photos where update_id is null/undefined, default), update (only photos where update_id === updateId), all (photos with photo source, no filtering by update_id). */
type GalleryVariant = 'structure' | 'update' | 'all';

/* Component props: photos (array of photos loaded for the project detail page). */
type Props = {
	photos: PhotoRow[];
	size?: GallerySize;
	variant?: GalleryVariant;
	updateId?: string;
};

/* Size presets for the gallery size. */
const SIZE_PRESETS: Record<
	GallerySize,
	{ slideBasis: string; imgHeight: string }
> = {
	/* Small size. */
	sm: { slideBasis: 'min-w-[50%] basis-[50%]', imgHeight: 'h-[220px]' },

	/* Medium: default size. */
	md: { slideBasis: 'min-w-[82%] basis-[82%]', imgHeight: 'h-[360px]' },

	/* Large size.. */
	lg: { slideBasis: 'min-w-[88%] basis-[88%]', imgHeight: 'h-[460px]' },
};

/* Gallery component: shows project photos (carousel) using Embla. */
const Gallery = ({
	photos,
	size = 'md',
	variant = 'structure',
	updateId,
}: Props) => {
	/* Filter only photos that have a valid photo_source (URL) and are not tied to a specific update (update_id must be null/undefined). This keeps the main gallery clean; update-specific photos are shown in update sections. */
	const items = useMemo<PhotoRow[]>(() => {
		const base: PhotoRow[] = (photos ?? []).filter(
			photo => photo?.photo_source,
		);

		/* If variant is "all". */
		if (variant === 'all') return base;

		/* If variant is "update". */
		if (variant === 'update') {
			if (typeof updateId !== 'string' || !updateId.trim()) return [];
			return base.filter(photo => photo.update_id === updateId);
		}

		/* If variant is "structure" (default). */
		return base.filter(
			photo => photo.update_id === null || photo.update_id === undefined,
		);
	}, [photos, variant, updateId]);

	/* Size preset. */
	const preset: {
		slideBasis: string;
		imgHeight: string;
	} = SIZE_PRESETS[size];

	/* Disable dragging if there is only one slide. */
	const canDrag: boolean = items.length > 1;

	/* Initialize Embla carousel; loop: infinite scrolling; align: center the currently selected slide. */
	const [emblaRef, emblaApi] = useEmblaCarousel({
		loop: true,
		align: 'center',
		watchDrag: canDrag,
	});

	/* Index of the currently selected snap (slide). */
	const [selectedIndex, setSelectedIndex] = useState<number>(0);

	/* Total number of snap points (slides) Embla created. */
	const [snapCount, setSnapCount] = useState<number>(0);

	/* Update selectedIndex whenever Embla changes the selected slide. */
	const onSelect = useCallback<() => void>(() => {
		if (!emblaApi) return;
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, [emblaApi]);

	/* Runs on Embla init/reInit: reads the snap list length; reads the currently selected snap. We schedule state updates in a microtask to avoid the "setState inside effect" warning (some React tooling flags synchronous setState inside effect bodies). */
	const onInitOrReInit = useCallback<() => void>(() => {
		if (!emblaApi) return;
		queueMicrotask(() => {
			setSnapCount(emblaApi.scrollSnapList().length);
			setSelectedIndex(emblaApi.selectedScrollSnap());
		});
	}, [emblaApi]);

	/* Subscribe to Embla events once the API is available: init: first time Embla mounts; reInit: Embla recalculates (e.g., resize, slide count changes); select: user navigates to another slide. Also trigger a reInit immediately to ensure snaps are computed correctly. */
	useEffect(() => {
		if (!emblaApi) return;

		emblaApi.on('init', onInitOrReInit);
		emblaApi.on('reInit', onInitOrReInit);
		emblaApi.on('select', onSelect);

		/* Ensure Embla computes snaps with the current DOM. */
		emblaApi.reInit();

		/* Cleanup listeners when emblaApi or callbacks change / component unmounts. */
		return () => {
			emblaApi.off('init', onInitOrReInit);
			emblaApi.off('reInit', onInitOrReInit);
			emblaApi.off('select', onSelect);
		};
	}, [emblaApi, onSelect, onInitOrReInit]);

	/* If the number of items changes, tell Embla to recompute snaps. */
	useEffect(() => {
		if (!emblaApi) return;
		emblaApi.reInit();
	}, [emblaApi, items.length]);

	/* Arrow handlers. Optional chaining prevents crash while emblaApi is not ready yet. */
	const scrollPrev = useCallback<() => void>(
		() => emblaApi?.scrollPrev(),
		[emblaApi],
	);
	const scrollNext = useCallback<() => void>(
		() => emblaApi?.scrollNext(),
		[emblaApi],
	);

	/* If there are no eligible gallery items, render nothing. */
	if (items.length === 0) return null;

	return (
		<div className="w-full">
			<div className="overflow-hidden" ref={emblaRef}>
				<div
					className={[
						'flex touch-pan-y select-none',
						items.length > 1 ? 'justify-evenly' : 'justify-start',
					].join(' ')}
				>
					{items.map((photo, i) => {
						/* Used for opacity effect: current slide full opacity, neighbors dimmed. */
						const isSelected: boolean = i === selectedIndex;

						/* Normalize optional fields to strings so rendering stays safe. */
						const desc: string =
							typeof photo.photo_description === 'string'
								? photo.photo_description
								: '';
						const author: string =
							typeof photo.photo_author === 'string' ? photo.photo_author : '';
						const dateIso: string =
							typeof photo.photo_date === 'string' ? photo.photo_date : '';
						const date: string = dateIso ? formatDate(dateIso) : '';

						return (
							/* Each slide: min-w/basis 82% shows partial previous/next slides; opacity animates between selected/non-selected; mx-3 creates spacing between slides */
							<div
								key={photo.photo_id ?? `${photo.photo_source}-${i}`}
								className={[
									'transition-opacity duration-200 mx-3 grow-0 shrink-0 ml-0 mr-6',
									preset.slideBasis,
									items.length > 1
										? 'cursor-grab active:cursor-grabbing'
										: 'cursor-default',
									isSelected ? 'opacity-100' : 'opacity-35',
								].join(' ')}
							>
								{/* Card wrapper for image + meta */}
								<div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
									<img
										className={[
											'block w-full object-cover',
											preset.imgHeight,
										].join(' ')}
										src={photo.photo_source ?? ''}
										alt={desc || `Photo ${i + 1}`}
										loading="lazy"
									/>

									{
										/* Meta section: render only if at least one field exists. */
										<div className="text-left pt-2.5 px-3 pb-3 ">
											<div className="font-bold">{desc || '\u00A0'}</div>
											<div className="text-gray-500 text-sm mt-0.5">
												<span>{author || (author && !date && '\u00A0')}</span>
												{author && date && <span> • </span>}
												<span>{date || '\u00A0'}</span>
											</div>
										</div>
									}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{
				/* Controls row: shown only if there are multiple photos; includes prev/next buttons + numeric counter. */
				items.length > 1 && (
					<div className="flex items-center justify-start gap-2.5 mt-2.5">
						<button
							type="button"
							className="w-[38px] h-[38px] rounded-[10px] border border-gray-200 bg-white inline-flex items-center justify-center cursor-pointer"
							onClick={scrollPrev}
						>
							{/* Left arrow icon. */}
							<svg className="w-[35%] h-[35%]" viewBox="0 0 532 532">
								<path
									fill="currentColor"
									d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
								/>
							</svg>
						</button>

						<button
							type="button"
							className="w-[38px] h-[38px] rounded-[10px] border border-gray-200 bg-white inline-flex items-center justify-center cursor-pointer"
							onClick={scrollNext}
						>
							{/* Right arrow icon. */}
							<svg className="w-[35%] h-[35%]" viewBox="0 0 532 532">
								<path
									fill="currentColor"
									d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
								/>
							</svg>
						</button>

						<div className="font-semibold text-black">
							{Math.min(selectedIndex + 1, snapCount || items.length)}/
							{snapCount || items.length}
						</div>

						<div className="mr-0 m-auto">
							<span className="font-semibold">Zdroj: </span>
							<a
								href={items[selectedIndex].photo_source as string}
								target="_blank"
								className="text-odb hover:text-olb"
							>
								{formatDomain(items[selectedIndex].photo_source)}
							</a>
						</div>
					</div>
				)
			}
		</div>
	);
};

export default Gallery;
