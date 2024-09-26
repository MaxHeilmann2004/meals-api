const STUDENT_DISCOUNT_INDEX: Array<{ categories: number[]; discount: number }> = [
	{
		categories: [187, 201],
		discount: 1.6,
	},
	{
		categories: [243],
		discount: 4.7,
	},
	{
		categories: [242],
		discount: 4.1,
	},
	{
		categories: [235],
		discount: 0.75,
	},
	{
		categories: [1490],
		discount: 1.6,
	},
	{
		categories: [249],
		discount: 3.7,
	},
	{
		categories: [251],
		discount: -1.0,
	},
	{
		categories: [247],
		discount: 0.75,
	},
];


const KOCHWERK_MAIN_JS = 'https://kochwerk-web.webspeiseplan.de/main.bf4740fd495508f750f5.js';
const KOCHWERK_TOKEN_REGEX = /PROXY_TOKEN:"([A-Za-z0-9]+)"/;
const KOCHWERK_MEALS_ENDPOINT = 'https://kochwerk-web.webspeiseplan.de/index.php?model=menu&location=1800&languagetype=1&_=1691667030626';

export { KOCHWERK_MAIN_JS, KOCHWERK_TOKEN_REGEX, KOCHWERK_MEALS_ENDPOINT, STUDENT_DISCOUNT_INDEX };