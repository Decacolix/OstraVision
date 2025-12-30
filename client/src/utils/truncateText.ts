/* Truncate long text, if the input is longer then maxLength, cut it and append "...". If not, return the original text. */
export const truncateText = (text: string, maxLength: number): string => {
	return text.length > maxLength
		? `${text.substring(0, maxLength)}...`
		: text.substring(0, maxLength);
};
