import { parse } from 'flags/mod.ts';
import { ensureSymlink } from 'fs/mod.ts';
import * as JSONC from 'encoding/jsonc.ts';
import { dirname, extname, join, resolve } from 'path/posix.ts';
import { homedir } from 'node/os.ts';

interface GlobalOptions {
	replace: boolean; // Replace existing file if found
	relative: boolean; // Relative symlink
}

interface Options extends GlobalOptions {
	path: string; // target path
}

interface Config {
	global?: GlobalOptions;
	link: {
		[sourcePath: string]: string;
	};
}

interface Args {
	config?: string;
}

// deno-lint-ignore no-explicit-any
function isConfig(file: any): file is Config {
	if (file !== null && file.link) {
		return true;
	}
	return false;
}

async function parseConfig(path: string): Promise<Config> {
	const fileContents = await Deno.readTextFile(path);
	const ext = extname(path);
	// deno-lint-ignore no-explicit-any
	let data: any;
	if (ext === '.json') {
		data = JSON.parse(fileContents);
	} else if (ext === '.jsonc') {
		data = JSONC.parse(fileContents);
	} else {
		throw new Error('Config file must be either .json OR .jsonc');
	}
	if (isConfig(data)) {
		return data;
	}
	throw new Error('Cannot parse config file');
}

export function pathFinder(path: string, configFilePath: string): string {
	if (path[0] === '~') {
		const home = homedir();
		if (home === null) {
			throw new Error('Home directory cannot be found');
		}
		return resolve(join(home, path.slice(1)));
	}
	return resolve(join(dirname(configFilePath), path));
}

async function link(config: Config, configFilePath: string): Promise<void> {
	try {
		for (const [key, value] of Object.entries(config.link)) {
			const src = pathFinder(key, configFilePath);
			const dest = pathFinder(value, configFilePath);

			try {
				try {
					await Deno.remove(dest);
				} catch (err) {
					if (!(err instanceof Deno.errors.NotFound)) {
						throw err;
					}
				}
				await ensureSymlink(src, dest);
			} catch (err) {
				if (err instanceof Deno.errors.NotFound) {
					console.error(err.message);
				} else {
					console.log(err);
				}
			}
		}
	} catch (err) {
		if (err instanceof Error) {
			console.error(err.message);
		}
	}
}

async function main(): Promise<void> {
	const parsedArgs = parse<Args>(Deno.args);
	let configFilePath = './config.json';
	if (parsedArgs.config) {
		configFilePath = parsedArgs.config;
	}

	try {
		const data = await parseConfig(configFilePath);
		if (parsedArgs._[0] === 'link') {
			link(data, configFilePath);
		}
	} catch (err) {
		if (err instanceof Error) {
			console.error(err.message);
		}
	}
}

main();
