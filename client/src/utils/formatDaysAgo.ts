/* Formats ISO date string into a "N days ago" format. */
export const formatDaysAgo = (isoDate: unknown): string => {
	/* Only accept strings. */
	if (typeof isoDate !== 'string' || !isoDate) return '';

	/* Convert the ISO date into a locale string in Prague timezone. */
	const localDate: string = new Date(isoDate).toLocaleString('en-US', {
		timeZone: 'Europe/Prague',
	});

	/* Create a new date object from the locale date. */
	const date: Date = new Date(localDate);

	/* Abort the function and return empty string if the date is invalid. */
	if (Number.isNaN(date.getTime())) return '-';

	/* Calculate difference between now and the given date in milliseconds. */
	const differenceMs: number = Date.now() - date.getTime();

	/* Convert milliseconds to full days. */
	const days: number = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

	/* If the value of days is <= 0, return today. */
	if (days <= 0) return 'dnes';

	/* If the value of days is equal to 1, return yesterday. */
	if (days === 1) return 'před 1 dnem';

	/* Else return number of days. */
	return `před ${days} dny`;
};
