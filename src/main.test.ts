import { homedir } from 'https://deno.land/std@0.151.0/node/os.ts';
import { assertEquals } from 'https://deno.land/std@0.151.0/testing/asserts.ts';
import { join, resolve } from 'https://deno.land/std@0.153.0/path/posix.ts';
import { describe, it } from 'testing/bdd.ts';
import { pathFinder } from './main.ts';

describe('pathfinder', () => {
	it('given no prefix', () => {
		const result = pathFinder('test.ts', '../example/config.json');
		const expected = resolve(join(Deno.cwd(), '../example/test.ts'));
		assertEquals(result, expected);
	});

	it('given ./', () => {
		const result = pathFinder('./test.ts', '../example/config.json');
		const expected = resolve(join(Deno.cwd(), '../example/test.ts'));
		assertEquals(result, expected);
	});

	it('given ~/', () => {
		const result = pathFinder('~/test.ts', '../example/config.json');
		const expected = resolve(join(homedir() ?? '', 'test.ts'));
		assertEquals(result, expected);
	});
});
