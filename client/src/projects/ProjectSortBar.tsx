import { useMemo, useState } from 'react';

type SortType = 'alphabetical' | 'time';
type SortDirection = 'asc' | 'desc';
type HoverKey = 'alphabetical' | 'time' | 'asc' | 'desc' | null;

type Props = {
	sortType: SortType;
	sortDirection: SortDirection;
	onChangeSortType: (type: SortType) => void;
	onChangeSortDirection: (direction: SortDirection) => void;
};

const iconPath = (name: string) => `src/assets/icons/${name}`;

const ProjectSortBar = ({
	sortType,
	sortDirection,
	onChangeSortType,
	onChangeSortDirection,
}: Props) => {
	const [hovered, setHovered] = useState<HoverKey>(null);

	const alphabeticalIcon: string = useMemo(() => {
		if (sortType === 'alphabetical')
			return iconPath('sort-alphabetical-active.svg');
		if (hovered === 'alphabetical')
			return iconPath('sort-alphabetical-hover.svg');
		return iconPath('sort-alphabetical-inactive.svg');
	}, [sortType, hovered]);

	const timeIcon: string = useMemo(() => {
		if (sortType === 'time') return iconPath('sort-time-active.svg');
		if (hovered === 'time') return iconPath('sort-time-hover.svg');
		return iconPath('sort-time-inactive.svg');
	}, [sortType, hovered]);

	const ascIcon: string = useMemo(() => {
		if (sortDirection === 'asc') return iconPath('arrow-active.svg');
		if (hovered === 'asc') return iconPath('arrow-hover.svg');
		return iconPath('arrow-inactive.svg');
	}, [sortDirection, hovered]);

	const descIcon: string = useMemo(() => {
		if (sortDirection === 'desc') return iconPath('arrow-active.svg');
		if (hovered === 'desc') return iconPath('arrow-hover.svg');
		return iconPath('arrow-inactive.svg');
	}, [sortDirection, hovered]);

	return (
		<div className="w-full flex justify-between">
			<div className="flex gap-3">
				<button
					className="cursor-pointer"
					type="button"
					onClick={() => onChangeSortType('alphabetical')}
					onMouseEnter={() => setHovered('alphabetical')}
					onMouseLeave={() => setHovered(null)}
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
