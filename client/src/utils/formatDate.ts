/* Formats ISO date string into a "day month year" format. */
export const formatDate = (isoDate: unknown): string => {
	/* Only accept strings. */
	if (typeof isoDate !== 'string' || !isoDate) return '';

	/* Convert the ISO date into a locale string in Prague timezone with named month. */
	const localDate: string = new Date(isoDate).toLocaleString('cs-CZ', {
		timeZone: 'Europe/Prague',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return localDate;
};
