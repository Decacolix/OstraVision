import { formatDaysAgo, truncateText } from '../utils';
import { formatDate } from '../utils/formatDate';
import Gallery from '../layout/Gallery';
import type { PhotoRow } from '../projects/ProjectDetailPage';

/* Type representing a single update record returned from the API. */
export type UpdateRow = {
	update_id: string;
	structure_id: string;
	update_date?: string;
	update_text?: string;
	[key: string]: unknown;
};

/* Component props: title (name of the structure), update (the UpdateRow), showDaysAge (true/false value to display the days ago information), photos (list of photos), gallerySize (the size of the gallery), onClick (click handler for opening the project detail). */
type Props = {
	title: string;
	update: UpdateRow;
	showDaysAgo?: boolean;
	photos?: PhotoRow[];
	gallerySize?: 'sm' | 'md' | 'lg';
	onClick?: () => void;
};

/* Update list item component: renders a single update item in the list. */
const UpdateListItem = ({
	title,
	update,
	onClick,
	showDaysAgo = true,
	photos = [],
	gallerySize = 'sm',
}: Props) => {
	/* Truncate title for UI consistency. */
	const safeTitle: string = truncateText(
		title || '(název není k dispozici)',
		60
	);

	/* The text of the update, truncated for UI consistency. */
	const text: string = update.update_text
		? truncateText(update.update_text, 200)
		: '(text není k dispozici)';

	/* Date converted to user-friendly format. */
	const daysAgo: string = formatDaysAgo(update.update_date ?? '');

	/* Date converted to day month year format. */
	const dateFull: string = formatDate(update.update_date ?? '');

	/* Photos for this update only (if provided, we keep only those belonging to this update). */
	const updatePhotos: PhotoRow[] = (photos ?? []).filter(
		photo => photo?.update_id === update.update_id
	);

	return (
		<div className="min-w-full">
			<div className="flex flex-col text-left">
				{/* Header + text block */}
				<div
					className={onClick ? 'hover:underline cursor-pointer' : ''}
					onClick={onClick}
				>
					<h3 className="font-bold" title={dateFull}>
						{safeTitle}
					</h3>
					<p className="my-2 wrap-anywhere">{text}</p>
				</div>

				{/* Optional gallery for update photos. */}
				{updatePhotos.length > 0 && (
					<div className="mt-2">
						<Gallery photos={updatePhotos} size={gallerySize} variant="all" />
					</div>
				)}

				{/* Optional "days ago" footer. */}
				{showDaysAgo && (
					<div className="text-gray-500 text-sm no-underline" title={dateFull}>
						Přidáno {daysAgo}
					</div>
				)}
			</div>
		</div>
	);
};

export default UpdateListItem;
