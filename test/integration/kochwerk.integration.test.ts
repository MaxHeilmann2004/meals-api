import { expect, test } from 'vitest';
import { getCapacity, getCapacityOutlet, getKochwerkToken, getMenu } from '../../src/speiseplan';

interface UpstreamRequest {
	status: number;
	path: string;
	model: string | null;
}

async function captureUpstreamRequests<T>(run: () => Promise<T>): Promise<{ result: T; requests: UpstreamRequest[] }> {
	const originalFetch = globalThis.fetch;
	const requests: UpstreamRequest[] = [];

	globalThis.fetch = async (input, init) => {
		const url = input instanceof Request ? new URL(input.url) : new URL(input.toString());
		let response: Response;
		try {
			response = await originalFetch(input, init);
		} catch {
			throw new Error('Kochwerk upstream request failed before receiving an HTTP response.');
		}

		requests.push({
			status: response.status,
			path: url.pathname,
			model: url.searchParams.get('model'),
		});
		return response;
	};

	try {
		return { result: await run(), requests };
	} finally {
		globalThis.fetch = originalFetch;
	}
}

function expectSuccessfulResponses(requests: UpstreamRequest[], expectedModels: Array<string | null>) {
	expect(requests.map(({ status }) => status >= 200 && status < 300)).toEqual(expectedModels.map(() => true));
	expect(requests.map(({ model }) => model)).toEqual(expectedModels);
}

test(
	'LIVE Kochwerk integration: discovers a token from the upstream script',
	async () => {
		const { result: token, requests } = await captureUpstreamRequests(getKochwerkToken);

		expectSuccessfulResponses(requests, [null]);
		expect(requests.map(({ path }) => path)).toEqual(['/index.js']);
		expect(token.length > 10 && /^[A-Za-z0-9]+$/.test(token)).toBe(true);
	},
	30_000,
);

test(
	'LIVE Kochwerk integration: menu endpoint returns a valid menu response',
	async () => {
		const { result: menu, requests } = await captureUpstreamRequests(getMenu);

		expectSuccessfulResponses(requests, [null, 'menu']);
		expect(requests.map(({ path }) => path)).toEqual(['/index.js', '/index.php']);
		expect(menu.success).toBe(true);
		expect(Array.isArray(menu.content)).toBe(true);
		expect(menu.content.every((location) => typeof location.speiseplanAdvanced?.titel === 'string')).toBe(true);
		expect(
			menu.content.every(
				({ speiseplanGerichtData }) => speiseplanGerichtData == null || Array.isArray(speiseplanGerichtData),
			),
		).toBe(true);
		expect(
			menu.content
				.filter((location) => Array.isArray(location.speiseplanGerichtData))
				.every((location) =>
					location.speiseplanGerichtData.every(
						(meal) =>
							typeof meal.speiseplanAdvancedGericht.id === 'number' &&
							typeof meal.speiseplanAdvancedGericht.datum === 'string' &&
							typeof meal.speiseplanAdvancedGericht.gerichtname === 'string',
					),
				),
		).toBe(true);
	},
	30_000,
);

test(
	'LIVE Kochwerk integration: capacity endpoints return valid response shapes',
	async () => {
		const { result: configurations, requests: configurationRequests } = await captureUpstreamRequests(getCapacity);
		const { result: outletCapacity, requests: outletRequests } = await captureUpstreamRequests(() => getCapacityOutlet(4));

		expectSuccessfulResponses(configurationRequests, [null, 'capacity']);
		expect(configurationRequests.map(({ path }) => path)).toEqual(['/index.js', '/index.php']);
		expect(configurations.success).toBe(true);
		expect(Array.isArray(configurations.content)).toBe(true);
		expect(
			configurations.content.every(
				(configuration) =>
					typeof configuration.outletID === 'number' &&
					typeof configuration.intervall === 'number' &&
					typeof configuration.maxSitzplaetze === 'number',
			),
		).toBe(true);

		expectSuccessfulResponses(outletRequests, [null, 'capacityOutlet']);
		expect(outletRequests.map(({ path }) => path)).toEqual(['/index.js', '/index.php']);
		expect(outletCapacity.success).toBe(true);
		expect(typeof outletCapacity.content.configuration.maxPersonsCount).toBe('number');
		expect(typeof outletCapacity.content.currentData.valueRelative).toBe('number');
		expect(typeof outletCapacity.content.currentData.valueAbsolute).toBe('number');
		expect(Array.isArray(outletCapacity.content.historicalData.values)).toBe(true);
		expect(
			outletCapacity.content.historicalData.values.every(
				(value) => typeof value.value === 'number' && typeof value.timestamp === 'string',
			),
		).toBe(true);
	},
	30_000,
);
