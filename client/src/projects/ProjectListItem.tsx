type Structure = {
	structure_id: string;
	name?: string;
	description?: string;
	type?: number;
	[key: string]: unknown;
};

type Props = {
	structure: Structure;
	photoUrl?: string | null;
	lastUpdatedLabel: string;
	onClick?: () => void;
};

const truncateText = (text: string, maxLength: number): string => {
	return text.length > maxLength
		? `${text.substring(0, maxLength)}...`
		: text.substring(0, maxLength);
};

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

const formatDaysAgo = (isoDate: unknown): string => {
	if (typeof isoDate !== 'string') return '-';

	const localDate: string = new Date(isoDate).toLocaleString('en-US', {
		timeZone: 'Europe/Prague',
	});
	const date: Date = new Date(localDate);

	if (Number.isNaN(date.getTime())) return '-';

	const differenceMs: number = Date.now() - date.getTime();
	const days: number = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

	if (days <= 0) return 'dnes';
	if (days === 1) return 'před 1 dnem';
	return `před ${days} dny`;
};

const ProjectListItem = ({
	structure,
	photoUrl,
	lastUpdatedLabel,
	onClick,
}: Props) => {
	const name: string = structure.name
		? truncateText(structure.name, 50)
		: '(jméno není k dispozici)';
	const shortDescription: string = structure.description
		? truncateText(structure.description, 120)
		: '(popisek není k dispozici)';
	const type: string = structure.type ? setType(structure.type) : '';

	return (
		<button type="button" onClick={onClick} className="min-w-full">
			<div className="h-35 text-white">
				<div
					className="overflow-hidden flex bg-gray-100 h-30 justify-end rounded-lg cursor-pointer hover:underline"
					style={{
						backgroundImage: `url(${photoUrl})`,
						backgroundRepeat: 'no-repeat',
						backgroundSize: 'cover',
						backgroundPosition: 'center',
					}}
				>
					<div className="px-3 text-left w-full sm:w-[80%] bg-gray-700/50  flex flex-col justify-center items-start">
						<h2 className="font-semibold text-md sm:text-lg">{name}</h2>
						<p className="text-xs sm:text-sm">{shortDescription}</p>
					</div>
				</div>
				<div className="pt-2 text-xs sm:text-sm flex flex-col sm:flex-row justify-between">
					{type ? (
						<div className="bg-gray-700 px-2 rounded-md  text-center sm:text-left mb-1 sm:mb-0">
							{type}
						</div>
					) : (
						<div></div>
					)}
					<div className="text-center sm:text-right text-gray-500">
						Poslední aktualizace {formatDaysAgo(lastUpdatedLabel)}
					</div>
				</div>
			</div>
		</button>
	);
};

export default ProjectListItem;
