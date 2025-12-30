import { formatDaysAgo, truncateText } from '../utils';
import { formatDate } from '../utils/formatDate';

/* Type representing a single update record returned from the API. */
export type UpdateRow = {
	update_id: string;
	structure_id: string;
	update_date?: string;
	update_text?: string;
	[key: string]: unknown;
};

/* Component props: structureName (name of the structure), update (the UpdateRow), onClick (click handler for opening the project detail). */
type Props = {
	structureName: string;
	update: UpdateRow;
	onClick?: () => void;
};

/* Update list item component: renders a single update item in the list. */
const UpdateListItem = ({ structureName, update, onClick }: Props) => {
	/* The title of the update is the structure name, truncated for UI consistency. */
	const title: string = truncateText(
		structureName || '(název není k dispozici)',
		50
	);

	/* The text of the update, truncated for UI consistency. */
	const text: string = update.update_text
		? truncateText(update.update_text, 200)
		: '(text není k dispozici)';

	/* Date converted to user-friendly format. */
	const daysAgo: string = formatDaysAgo(update.update_date ?? '');

	/* Date converted to day month year format. */
	const date: string = formatDate(update.update_date ?? '');

	return (
		<button type="button" className="min-w-full">
			<div className="flex flex-col text-left">
				<div className="hover:underline cursor-pointer" onClick={onClick}>
					<h3 className="font-bold">{title}</h3>
					<p className="my-2">{text}</p>
				</div>
				<div className="text-gray-500 text-sm no-underline" title={date}>
					Přidáno {daysAgo}
				</div>
			</div>
		</button>
	);
};

export default UpdateListItem;
