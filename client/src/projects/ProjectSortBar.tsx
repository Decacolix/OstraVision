import { useMemo, useState } from 'react';

/* Sort type selection: alphabetical – by project name, time – by last update. */
export type SortType = 'alphabetical' | 'time';

/* Sort direction selection: ascending (asc) – A → Z / oldest → newest, descending (desc) – Z → A / newest → oldest. */
export type SortDirection = 'asc' | 'desc';

/* UI state for hover tracks which icon is currently hovered, null means nothing is hovered. */
type HoverKey = 'alphabetical' | 'time' | 'asc' | 'desc' | null;

/* Component props: sortType / sortDirection are the currently active settings, onChangeSortType / onChangeSortDirection are callbacks to update the parent state. */
type Props = {
	sortType: SortType;
	sortDirection: SortDirection;
	onChangeSortType: (type: SortType) => void;
	onChangeSortDirection: (direction: SortDirection) => void;
	disabled: boolean;
};

/* Helper to build a relative path to an icon by filename. */
const iconPath = (name: string) => `src/assets/icons/${name}`;

/* Sorting bar compoment: shows 4 icon total (sort type alphabetical / time and sort direction asc / desc). Each icon has 3 visual states (active / hover / inactive). */
const ProjectSortBar = ({
	sortType,
	sortDirection,
	onChangeSortType,
	onChangeSortDirection,
	disabled,
}: Props) => {
	/* Hover tracking state stores which control is currently hovered. */
	const [hovered, setHovered] = useState<HoverKey>(null);

	/* Determine which icon to use for the alphabetical sort icon. */
	const alphabeticalIcon: string = useMemo(() => {
		if (sortType === 'alphabetical')
			return iconPath('sort-alphabetical-active.svg');
		if (hovered === 'alphabetical')
			return iconPath('sort-alphabetical-hover.svg');
		return iconPath('sort-alphabetical-inactive.svg');
	}, [sortType, hovered]);

	/* Determine which icon to use for the time sort icon. */
	const timeIcon: string = useMemo(() => {
		if (sortType === 'time') return iconPath('sort-time-active.svg');
		if (hovered === 'time') return iconPath('sort-time-hover.svg');
		return iconPath('sort-time-inactive.svg');
	}, [sortType, hovered]);

	/* Determine which icon to use for the ascending direction icon. */
	const ascIcon: string = useMemo(() => {
		if (sortDirection === 'asc') return iconPath('arrow-active.svg');
		if (hovered === 'asc') return iconPath('arrow-hover.svg');
		return iconPath('arrow-inactive.svg');
	}, [sortDirection, hovered]);

	/* Determine which icon to use for the descending direction icon. */
	const descIcon: string = useMemo(() => {
		if (sortDirection === 'desc') return iconPath('arrow-active.svg');
		if (hovered === 'desc') return iconPath('arrow-hover.svg');
		return iconPath('arrow-inactive.svg');
	}, [sortDirection, hovered]);

	return (
		<div className="w-full flex justify-between pb-2">
			<div className="flex gap-3">
				<button
					className="cursor-pointer"
					type="button"
					onClick={() => onChangeSortType('alphabetical')}
					onMouseEnter={() => setHovered('alphabetical')}
					onMouseLeave={() => setHovered(null)}
					disabled={disabled}
				>
					<img
						src={alphabeticalIcon}
						alt="Alphabetical sort"
						className="h-8"
						title="Seřadit abecedně"
					/>
				</button>
				<button
					className="cursor-pointer"
					type="button"
					onClick={() => onChangeSortType('time')}
					onMouseEnter={() => setHovered('time')}
					onMouseLeave={() => setHovered(null)}
					disabled={disabled}
				>
					<img
						src={timeIcon}
						alt="Time sort"
						className="h-8"
						title="Seřadit dle času"
					/>
				</button>
			</div>
			<div className="flex gap-3">
				<button
					className="cursor-pointer"
					type="button"
					onClick={() => onChangeSortDirection('asc')}
					onMouseEnter={() => setHovered('asc')}
					onMouseLeave={() => setHovered(null)}
					disabled={disabled}
				>
					<img
						src={ascIcon}
						alt="Ascending"
						className="h-8"
						title="Seřadit vzestupně"
					/>
				</button>
				<button
					className="cursor-pointer"
					type="button"
					onClick={() => onChangeSortDirection('desc')}
					onMouseEnter={() => setHovered('desc')}
					onMouseLeave={() => setHovered(null)}
					disabled={disabled}
				>
					<img
						src={descIcon}
						alt="Descending"
						className="h-8 rotate-180"
						title="Seřadit sestupně"
					/>
				</button>
			</div>
		</div>
	);
};

export default ProjectSortBar;
