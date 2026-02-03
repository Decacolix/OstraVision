/* Component properties. */
type Props = {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
};

/* Search bar component: renders the text input to filter projects by text. */
const SearchBar = ({ value, onChange, disabled }: Props) => {
	/* Determine whether the input contains any text. */
	const hasText = value.trim().length > 0;

	return (
		<div className="w-[55%] sm:w-[75%] relative">
			<input
				type="text"
				value={value}
				onChange={e => onChange(e.target.value)}
				disabled={disabled}
				placeholder="Vyhledávat..."
				className="border-b-odb border-b-3 outline-0 h-8 w-full pr-8 focus:border-b-olb"
			></input>
			{/* Icon container positioned inside the input on the right side. The icon changes based on whether the user typed any text. */}
			<div className="absolute right-2 bottom-1/2 translate-y-1/2">
				<img
					alt="Search icon"
					className="w-4"
					src={
						hasText
							? 'src/assets/icons/search-icon-active.svg'
							: 'src/assets/icons/search-icon-inactive.svg'
					}
				/>
			</div>
		</div>
	);
};

export default SearchBar;
