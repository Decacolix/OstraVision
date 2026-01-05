import FilterResetButton from './FilterResetButton';

/* Component props: hasActiveFilters (check if there are any active filters), onToggle (function when the button is active/inactive), onReset (function when the filters are reseted), disabled (if the element is disabled). */
type Props = {
	hasActiveFilters: boolean;
	onToggle: () => void;
	onReset: () => void;
	disabled?: boolean;
};

/* Filter button component: renders icon to toggle the filters. */
const FilterButton = ({
	hasActiveFilters,
	onToggle,
	onReset,
	disabled,
}: Props) => {
	return (
		<div className="flex items-center">
			{/* Main filter toggle button shows active styling when any filter is applied. */}
			<button
				type="button"
				onClick={onToggle}
				disabled={disabled}
				className={[
					'px-4 py-2 rounded-md font-semibold border cursor-pointer',
					hasActiveFilters
						? 'bg-odb text-white border-odb hover:bg-olb hover:border-olb'
						: 'bg-white text-odb border-odb hover:text-olb hover:border-olb',
				].join(' ')}
			>
				FILTRY
			</button>

			{
				/* Reset button appears only when at least one filter is active. */
				hasActiveFilters && (
					<FilterResetButton
						onClick={onReset}
						disabled={disabled}
						title="Resetovat filtry"
					/>
				)
			}
		</div>
	);
};

export default FilterButton;
