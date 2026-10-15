import { afterEach, expect, test, vi } from 'vitest';
import { getCapacityOutlet, getKochwerkToken, getMenu } from '../src/speiseplan';
import { getKochwerkToken as getExportedKochwerkToken } from '../src/index';

const token = 'testKochwerkToken12345';
const mainJsUrl = 'https://kochwerk-web.webspeiseplan.de/index.js';
const apiUrl = 'https://kochwerk-web.webspeiseplan.de/index.php';

afterEach(() => {
	vi.unstubAllGlobals();
});

function tokenResponse() {
	return new Response(`window.config = { PROXY_TOKEN:"${token}" };`);
}

test('exports the Kochwerk token getter from the package entry point', () => {
	expect(getExportedKochwerkToken).toBe(getKochwerkToken);
});

test('extracts the Kochwerk token from the main script', async () => {
	const fetchMock = vi.fn().mockResolvedValue(tokenResponse());
	vi.stubGlobal('fetch', fetchMock);

	await expect(getKochwerkToken()).resolves.toBe(token);
	expect(fetchMock).toHaveBeenCalledWith(mainJsUrl);
});

test('requests the menu endpoint and accepts an empty menu', async () => {
	const fetchMock = vi
		.fn()
		.mockResolvedValueOnce(tokenResponse())
		.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, content: [] })));
	vi.stubGlobal('fetch', fetchMock);

	const menu = await getMenu();

	expect(menu).toEqual({ success: true, content: [] });
	expect(fetchMock).toHaveBeenCalledTimes(2);
	const requestUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
	expect(requestUrl.origin + requestUrl.pathname).toBe(apiUrl);
	expect(requestUrl.searchParams.get('token')).toBe(token);
	expect(requestUrl.searchParams.get('model')).toBe('menu');
	expect(fetchMock.mock.calls[1]?.[1]).toEqual({
		headers: { Referer: 'https://kochwerk-web.webspeiseplan.de/menu' },
	});
});

test('requests outlet capacity for the specified outlet', async () => {
	const capacityResponse = {
		success: true,
		content: {
			configuration: {},
			currentData: {},
			historicalData: { values: [] },
		},
	};
	const fetchMock = vi
		.fn()
		.mockResolvedValueOnce(tokenResponse())
		.mockResolvedValueOnce(new Response(JSON.stringify(capacityResponse)));
	vi.stubGlobal('fetch', fetchMock);

	const capacity = await getCapacityOutlet(4);

	expect(capacity).toEqual(capacityResponse);
	const requestUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
	expect(requestUrl.searchParams.get('token')).toBe(token);
	expect(requestUrl.searchParams.get('model')).toBe('capacityOutlet');
	expect(requestUrl.searchParams.get('outlet')).toBe('4');
});
