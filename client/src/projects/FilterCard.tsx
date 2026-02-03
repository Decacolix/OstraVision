import { useEffect, useMemo } from 'react';
import { CATEGORIES } from '../utils/constants';
import { clamp } from '../utils/clamp';

/* Type for filtering by locaiton. */
type LocationFilterOption = {
	key: string;
	label: string;
	kind: 'district' | 'city';
};

/* Component properties. */
type Props = {
	isOpen: boolean;
	selectedCategories: number[];
	onToggleCategory: (categoryIndex: number) => void;
	locationOptions: LocationFilterOption[];
	selectedLocations: string[];
	onToggleLocation: (key: string) => void;
	minBudget: number;
	maxBudget: number;
	absoluteMaxBudget: number;
	onChangeMinBudget: (value: number) => void;
	onChangeMaxBudget: (value: number) => void;
};

/* Filter card component: renders specific filters for projects. */
const FilterCard = ({
	isOpen,
	selectedCategories,
	locationOptions,
	selectedLocations,
	onToggleLocation,
	onToggleCategory,
	minBudget,
	maxBudget,
	absoluteMaxBudget,
	onChangeMinBudget,
	onChangeMaxBudget,
}: Props) => {
	/* Convert the selected category indices to a Set for quick lookups. */
	const selectedSet = useMemo<Set<number>>(
		() => new Set(selectedCategories),
		[selectedCategories],
	);

	/* Ensure the "absolute max" is never negative. Useful when there are no items yet. */
	const safeMax = useMemo<number>(
		() => Math.max(0, absoluteMaxBudget),
		[absoluteMaxBudget],
	);

	/* Set the selected location labels. */
	const selectedLocationsSet = useMemo<Set<string>>(
		() => new Set(selectedLocations),
		[selectedLocations],
	);

	/* Slider step is dynamic: at least 1000, otherwise ~1 % of the current maximum. */
	const step = useMemo<number>(() => {
		if (!safeMax) return 1000;
		const rough = Math.round(safeMax / 100);
		return Math.max(1000, rough);
	}, [safeMax]);

	/* Guard if user sets min above max (for example via inputs), clamp it back down. */
	useEffect(() => {
		if (minBudget > maxBudget) onChangeMinBudget(maxBudget);
	}, [minBudget, maxBudget, onChangeMinBudget]);

	/* Minimum percent positions for drawing the highlighted range bar behind the sliders. */
	const minPercent = useMemo<number>(() => {
		if (safeMax === 0) return 0;
		return (minBudget / safeMax) * 100;
	}, [minBudget, safeMax]);

	/* Maximum percent positions for drawing the highlighted range bar behind the sliders. */
	const maxPercent = useMemo<number>(() => {
		if (safeMax === 0) return 100;
		return (maxBudget / safeMax) * 100;
	}, [maxBudget, safeMax]);

	/* Handle min value from either slider or input, always clamp into [0, maxBudget]. */
	const handleMin = (raw: string): void => {
		const next = clamp(parseInt(raw, 10) || 0, 0, maxBudget);
		onChangeMinBudget(next);
	};

	/* Handle max value from either slider or input, always clamp into [minBudget, safeMax]. */
	const handleMax = (raw: string): void => {
		const next: number = clamp(parseInt(raw, 10) || 0, minBudget, safeMax);
		onChangeMaxBudget(next);
	};

	return (
		/* Expand/collapse container with vertical scaling animation. */
		<div
			className={[
				'origin-top overflow-hidden rounded-md border border-gray-200 bg-white transition-all duration-300 ease-in-out',
				isOpen
					? 'max-h-[750px] scale-y-100 opacity-100 p-4 mt-3 overflow-y-scroll'
					: 'max-h-0 scale-y-0 opacity-0 p-0 mt-0',
			].join(' ')}
		>
			{/* Category multi-select. Each category toggles on/off independently. */}
			<div className="flex flex-wrap gap-2 border-b border-gray-300 pb-3">
				{CATEGORIES.map((label, idx) => {
					const isSelected: boolean = selectedSet.has(idx);
					return (
						<button
							type="button"
							key={label}
							onClick={() => onToggleCategory(idx)}
							className={[
								'px-3 py-1 rounded-full text-sm font-semibold cursor-pointer',
								'border',
								isSelected
									? 'bg-odb text-white border-odb hover:bg-olb hover:border-olb'
									: 'bg-white text-gray-500 border-gray-300 hover:bg-olb hover:border-olb hover:text-white',
							].join(' ')}
						>
							{label}
						</button>
					);
				})}
			</div>

			{/* Location multi-select (district/city). */}
			{locationOptions.length > 0 && (
				<div className="mt-3 pb-3 flex flex-wrap gap-2 border-b border-gray-300">
					{locationOptions.map(opt => {
						const isSelected: boolean = selectedLocationsSet.has(opt.key);

						return (
							<button
								type="button"
								key={opt.key}
								onClick={() => onToggleLocation(opt.key)}
								className={[
									'px-3 py-1 text-sm font-semibold cursor-pointer border', // similar sizing
									'rounded-none', // NOT rounded/pill (as requested)
									isSelected
										? 'bg-odb text-white border-odb hover:bg-olb hover:border-olb'
										: 'bg-white text-gray-500 border-gray-300 hover:bg-olb hover:border-olb hover:text-white',
								].join(' ')}
								title={opt.kind === 'district' ? 'Městský obvod' : 'Město'}
							>
								{opt.label}
							</button>
						);
					})}
				</div>
			)}

			{/* Budget range filter, two-thumb range slider + min/max number inputs. */}
			<div className="mt-5">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-600">
					<div>Rozpočet:</div>
					{/* Numeric inputs linked to the same min/max state as the sliders. */}
					<div className="flex flex-col sm:flex-row items-center mt-2 sm:mt-0">
						<div className="flex items-center">
							<div>
								<input
									type="number"
									inputMode="numeric"
									min={0}
									max={maxBudget}
									value={minBudget}
									onChange={e => handleMin(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 w-[140px]"
								/>
							</div>
							<div className="ml-2 font-bold">Kč</div>
						</div>
						<div className="mx-4 font-bold self-start sm:self-auto">
							&mdash;
						</div>
						<div className="flex items-center">
							<div>
								<input
									type="number"
									inputMode="numeric"
									min={minBudget}
									max={safeMax}
									value={maxBudget}
									onChange={e => handleMax(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 w-[140px]"
								/>
							</div>
							<div className="ml-2 font-bold">Kč</div>
						</div>
					</div>
				</div>

				{/* Slider track + highlighted selected range segment. */}
				<div className="mt-4 relative h-10">
					<div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gray-200" />
					<div
						className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-odb"
						style={{
							left: `${minPercent}%`,
							width: `${Math.max(0, maxPercent - minPercent)}%`,
						}}
					/>

					{/* Minimum thumb slider (kept above when thumbs overlap). */}
					<input
						type="range"
						min={0}
						max={safeMax}
						step={step}
						value={minBudget}
						onChange={e => handleMin(e.target.value)}
						className={[
							'filter-range absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full',
							minBudget >= safeMax - step ? 'z-30' : 'z-40',
						].join(' ')}
					/>

					{/* Maximum thumb slider. */}
					<input
						type="range"
						min={0}
						max={safeMax}
						step={step}
						value={maxBudget}
						onChange={e => handleMax(e.target.value)}
						className="filter-range absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full z-30"
					/>
				</div>
			</div>
		</div>
	);
};

export default FilterCard;
