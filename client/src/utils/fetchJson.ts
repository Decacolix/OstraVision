/* Fetch data. Uses AbortSignal so requests can be cancelled when sorting changes or component reloads. Throws error responses so error handling can be centralized in try/catch. */
export const fetchJson = async <T>(
	url: string,
	signal?: AbortSignal
): Promise<T> => {
	/* Await to fetch the data. */
	const res = await fetch(url, { signal });

	/* If the server responds with an error status, stop and throw an error. */
	if (!res.ok) throw new Error(`Request failed: ${res.status}`);

	/* Parse JSON and return it as the expected generic type. */
	return (await res.json()) as T;
};
