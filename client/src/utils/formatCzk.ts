/* Format a number as CZK currency (1200000 => "1 200 000 Kč"). */
export const formatCzk = (value: number): string => {
	try {
		return new Intl.NumberFormat('cs-CZ', {
			style: 'currency',
			currency: 'CZK',
			maximumFractionDigits: 0,
		}).format(value);
	} catch {
		return `${Math.round(value)} Kč`;
	}
};
