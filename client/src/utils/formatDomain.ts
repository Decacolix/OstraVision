/* Format URL to display only the domain. */
export const formatDomain = (url?: string | null): string => {
	if (typeof url !== 'string' || !url.trim()) return '';

	try {
		const parsed = new URL(url);

		/* Hostname without protocol, path, query. */
		const hostname = parsed.hostname;

		/* Capitalize first letter. */
		return hostname.charAt(0).toUpperCase() + hostname.slice(1);
	} catch {
		/* If the URL is invalid. */
		return '';
	}
};
