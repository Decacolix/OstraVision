/* Component properties. */
type Props = {
	onClick: () => void;
	title?: string;
	disabled?: boolean;
};

/* Filter reset button component: renders icon to reset the filters. */
const FilterResetButton = ({ onClick, title, disabled }: Props) => {
	return (
		/* Button that resets all filters back to default values. */
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title ?? 'Resetovat filtry'}
			className="ml-2 inline-flex items-center justify-center rounded-md p-2 cursor-pointer"
		>
			{/* Icon swaps on hover by changing the image source. */}
			<img
				src="src/assets/icons/close-icon.svg"
				onMouseOver={e =>
					(e.currentTarget.src = 'src/assets/icons/close-icon-hover.svg')
				}
				onMouseOut={e =>
					(e.currentTarget.src = 'src/assets/icons/close-icon.svg')
				}
				alt="Reset filters"
				className="h-4 w-4"
			/>
		</button>
	);
};

export default FilterResetButton;
