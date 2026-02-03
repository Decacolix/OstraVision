/* Format URL to display only the domain. */
export const formatDomain = (url?: string | null): string => {
	if (typeof url !== 'string' || !url.trim()) return '';

	try {
		const parsed = new URL(url);

		/* Return hostname without protocol, path, query, and "www". */
		return parsed.hostname.replace(/^www\./i, '');
	} catch {
		/* If the URL is invalid, return empty string. */
		return '';
	}
};
