/* Formats price by adding spaces between thousands and changing decimal point to decimal comma. */
export const formatPrice = (value: string | number): string => {
	/* Split the value to integer and decimal part. */
	const parts = value.toString().split('.');

	/* Add space between thousands. */
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

	/* If there is no decimal part, return only the integer part. */
	if (parts[1] === '00') return parts[0];

	/* Else add the decimal part with comma separator. */
	return parts.join(',');
};
