import { truncateText, formatDaysAgo } from '../utils';
import { formatDate } from '../utils/formatDate';
import { formatPrice } from '../utils/formatPrice';

/* Exported type representing one project record from the API. */
export type Structure = {
	structure_id: string;
	name?: string;
	description?: string;
	type?: number;
	budget?: number;
	updated_at?: string;
	[key: string]: unknown;
};

/* Component props: structure (the project record from the database), photoUrl (cover image), lastUpdatedLabel (ISO date string), onClick (click handler for opening the project detail). */
type Props = {
	structure: Structure;
	photoUrl?: string | null;
	lastUpdatedLabel: string;
	onClick?: () => void;
};

/* Convert the numeric type value into category label. */
const setType = (type: number): string => {
	switch (type) {
		case 0:
			return 'Služby';
		case 1:
			return 'Obchody';
		case 2:
			return 'Vzdělávání';
		case 3:
			return 'Doprava';
		case 4:
			return 'Bydlení';
		case 5:
			return 'Příroda';
		case 6:
			return 'Sport';
		case 7:
			return 'Kultura';
		case 8:
			return 'Kanceláře';
		case 9:
			return 'Průmysl';
		default:
			return '';
	}
};

/* Project list item component: renders a single structure item in the list. */
const ProjectListItem = ({
	structure,
	photoUrl,
	lastUpdatedLabel,
	onClick,
}: Props) => {
	/* Project title, truncated for UI consistency. */
	const name: string = structure.name
		? truncateText(structure.name, 50)
		: '(název není k dispozici)';

	/* Project description, truncated for UI consistency. */
	const shortDescription: string = structure.description
		? truncateText(structure.description, 120)
		: '(popisek není k dispozici)';

	/* Category label, shows empty string for missing value. */
	const type: string = structure.type ? setType(structure.type) : '';

	const budget: string = structure.budget
		? `${formatPrice(structure.budget)} Kč`
		: '';

	return (
		<button type="button" className="min-w-full">
			<div className="h-35 text-white my-5">
				<div
					className="overflow-hidden flex bg-gray-400 h-30 justify-end rounded-lg cursor-pointer hover:underline"
					style={{
						backgroundImage: `url(${photoUrl})`,
						backgroundRepeat: 'no-repeat',
						backgroundSize: 'cover',
						backgroundPosition: 'center',
					}}
					onClick={onClick}
				>
					<div className="px-3 text-left w-full sm:w-[80%] bg-gray-700/50  flex flex-col justify-center items-start">
						<h2 className="font-semibold text-md sm:text-lg">{name}</h2>
						<p className="text-xs sm:text-sm">{shortDescription}</p>
					</div>
				</div>
				<div className="pt-2 text-xs sm:text-sm flex flex-col sm:flex-row justify-between">
					<div className="flex justify-center sm:justify-start">
						{
							/* Only render the category label if the type exists. Otherwise render an empty div to preserve spacing. */
							type ? (
								<div className="bg-gray-700 px-2 rounded-md  text-center sm:text-left mb-1 sm:mb-0 mr-2">
									{type}
								</div>
							) : (
								<div></div>
							)
						}
						{
							/* Only render the price label if the type exists. Otherwise render an empty div to preserve spacing. */
							budget ? (
								<div className="bg-olb px-2 rounded-md  text-center sm:text-left mb-1 sm:mb-0">
									{budget}
								</div>
							) : (
								<div></div>
							)
						}
					</div>
					<div
						className="text-center sm:text-right text-gray-500"
						title={formatDate(lastUpdatedLabel) || ''}
					>
						Poslední aktualizace {formatDaysAgo(lastUpdatedLabel)}
					</div>
				</div>
			</div>
		</button>
	);
};

export default ProjectListItem;
