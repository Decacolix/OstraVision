import type { LocationRow } from '../types/LocationRow';

/* Function to format location to "<street> <house_number>, <postal_code> <city> – <urban_district>" format. */
export const formatLocation = (location: LocationRow): string => {
	/* Trim location data. */
	const street = (location.street ?? '').trim();
	const house = (location.house_number ?? '').trim();
	const postal = (location.postal_code ?? '').trim();
	const city = (location.city ?? '').trim();
	const district = (location.urban_district ?? '').trim();

	/* Format postal code to "### ##" if it's lenght is 5. */
	const formattedPostal =
		postal.length === 5
			? postal.slice(0, 3) + ' ' + postal.slice(3, 5)
			: postal;

	/* Create the street part of the string. */
	const streetPart = [street, house].filter(Boolean).join(' ').trim();

	/* Create the city part of the string. */
	const cityPart = [formattedPostal, city].filter(Boolean).join(' ').trim();

	/* Create the left part of the string ("<street> <house_number>, <postal_code> <city>"). */
	const left = [streetPart, cityPart].filter(Boolean).join(', ').trim();

	/* If there is no left part, return just the district. */
	if (!left) return district;

	/* Return the formatted location. */
	return district ? `${left} – ${district}` : left;
};
