import { expect, test } from 'vitest';
import { getKochwerkToken, getMenu } from '../src/speiseplan';

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
