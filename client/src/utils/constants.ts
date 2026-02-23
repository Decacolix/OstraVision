import type { NavItem } from '../types/NavItem';

/* Base URLs for backend endpoints. */
export const API: {
	locations: string;
	structures: string;
	photos: string;
	updates: string;
	investors: string;
	contractors: string;
	authors: string;
	writers: string;
	sources: string;
} = {
	structures: 'http://localhost:3000/api/data/structures/',
	photos: 'http://localhost:3000/api/data/photos/',
	updates: 'http://localhost:3000/api/data/updates',
	investors: 'http://localhost:3000/api/data/investors/',
	contractors: 'http://localhost:3000/api/data/contractors/',
	authors: 'http://localhost:3000/api/data/authors/',
	writers: 'http://localhost:3000/api/data/writers/',
	sources: 'http://localhost:3000/api/data/sources/',
	locations: 'http://localhost:3000/api/data/locations/',
};

/* List of categories. */
export const CATEGORIES: string[] = [
	'Služby', // 0
	'Obchody', // 1
	'Vzdělávání', // 2
	'Doprava', // 3
	'Bydlení', // 4
	'Příroda', // 5
	'Sport', // 6
	'Kultura', // 7
	'Kanceláře', // 8
	'Průmysl', // 9
];

/* Base styles for navigation link. */
export const NAV_LINK_BASE: string =
	'navlink cursor-pointer wrap text-center text-sm sm:text-base mt-12 px-2 md:px-4 lg:mt-0';

/* Styles for active navigation link. */
export const NAV_LINK_ACTIVE: string = 'text-odb';

/* Styles for inactive navigation link. */
export const NAV_LINK_INACTIVE: string = 'text-olb';

/* List of items in the navigation. */
export const NAV_ITEMS: NavItem[] = [
	{ to: '/projekty', label: 'PROJEKTY' },
	{ to: '/kultura-gastro', label: 'KULTURA & GASTRO' },
	{ to: '/o-nas', label: 'O NÁS' },
];

/* Default map center (Ostrava area). */
export const DEFAULT_CENTER: [number, number] = [
	49.81637370301487, 18.227087042101008,
];
