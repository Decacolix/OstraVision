/* Base URLs for backend endpoints. */
export const API: {
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
