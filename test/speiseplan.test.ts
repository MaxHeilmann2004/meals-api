import { expect, test } from 'vitest';
import { getCapacityOutlet, getKochwerkToken, getMenu } from '../src/speiseplan';

test('extract kochwerk token from main.js', async () => {
	const token = await getKochwerkToken();

	expect(token).toBeDefined();
	expect(token).not.toBeUndefined();
	expect(token).not.toBeNull();
	expect(token.length).toBeGreaterThan(10);
});

test("successfully fetch kochwerk's menu endpoint", async () => {
	const menu = await getMenu();

	expect(menu).toBeDefined();
	expect(menu).not.toBeUndefined();
	expect(menu).not.toBeNull();
	expect(menu.content.length).toBeGreaterThan(0);
});

test("successfully fetch kochwerk's capacity endpoint", async () => {
	const capacity = await getCapacityOutlet(4);

	expect(capacity).toBeDefined();
	expect(capacity).not.toBeUndefined();
	expect(capacity).not.toBeNull();
	expect(capacity.success).toBe(true);
	expect(capacity.content).toBeDefined();
	expect(Array.isArray(capacity.content.historicalData.values)).toBe(true);
});
