import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import {
	transform,
	transformDynamicImport,
	resolveTsPath,
	compareNodeVersion,
} from '@esbuild-kit/core-utils';
import type { TransformOptions } from 'esbuild';
import {
	applySourceMap,
	tsconfigRaw,
	tsconfigPathsMatcher,
	tsExtensionsPattern,
	getFormatFromExtension,
	type ModuleFormat,
	type MaybePromise,
} from './utils';
import { getPackageType } from './package-json';

type Resolved = {
	url: string;
	format: ModuleFormat;
};

type Context = {
	conditions: string[];
	parentURL: string | undefined;
};

type resolve = (
	specifier: string,
	context: Context,
	defaultResolve: resolve,
	recursiveCall?: boolean,
) => MaybePromise<Resolved>;

const mappedExtensions: Record<string, string[]> = {
	'.js': ['.ts', '.tsx'],
	'.jsx': ['.ts', '.tsx'],
	'.cjs': ['.cts'],
	'.mjs': ['.mts'],
	'': ['.ts', '.js', '.json', '.tsx', '.jsx'],
};

function resolveTsAlternativeSpecifiers(specifier: string) {
	const alternativePaths = mappedExtensions[''].map(alternativeExtension => ({
		specifier,
		specifierExtension: '',
		alternativeExtension,
	}));
	const specifierExtension = path.extname(specifier);
	if (!specifierExtension) {
		return alternativePaths;
	}
	const extensionsToTry = mappedExtensions[specifierExtension] ?? [];
	specifier = specifier.slice(0, specifier.length - specifierExtension.length);
	return [
		// Try using subextension first
		...alternativePaths,
		...extensionsToTry.map(alternativeExtension => ({
			specifier,
			specifierExtension,
			alternativeExtension,
		})),
	];
}

async function tryExtensions(
	specifier: string,
	context: Context,
	defaultResolve: resolve,
) {
	let error;
	for (const alternativePath of resolveTsAlternativeSpecifiers(specifier)) {
		const {
			specifier: alternativeSpecifier,
			specifierExtension,
			alternativeExtension,
		} = alternativePath;
		try {
			return await resolve(
				`${alternativeSpecifier}${alternativeExtension}`,
				context,
				defaultResolve,
				true,
			);
		} catch (_error: any) {
			if (error === undefined) {
				const { message } = _error;
				_error.message = _error.message.replace(`${alternativeExtension}'`, `${specifierExtension}'`);
				_error.stack = _error.stack.replace(message, _error.message);
				error = _error;
			}
		}
	}

	throw error;
}

async function tryDirectory(
	specifier: string,
	context: Context,
	defaultResolve: resolve,
) {
	const appendIndex = specifier.endsWith('/') ? 'index' : '/index';

	try {
		return await tryExtensions(specifier + appendIndex, context, defaultResolve);
	} catch (error: any) {
		const { message } = error;
		error.message = error.message.replace(`${appendIndex.replace('/', path.sep)}'`, "'");
		error.stack = error.stack.replace(message, error.message);
		throw error;
	}
}

const fileProtocol = 'file://';
const isPathPattern = /^\.{0,2}\//;

const supportsNodePrefix = (
	compareNodeVersion([14, 13, 1]) >= 0
	|| compareNodeVersion([12, 20, 0]) >= 0
);

export const resolve: resolve = async function (
	specifier,
	context,
	defaultResolve,
	recursiveCall,
) {
	// Added in v12.20.0
	// https://nodejs.org/api/esm.html#esm_node_imports
	if (!supportsNodePrefix && specifier.startsWith('node:')) {
		specifier = specifier.slice(5);
	}

	// If directory, can be index.js, index.ts, etc.
	if (specifier.endsWith('/')) {
		return await tryDirectory(specifier, context, defaultResolve);
	}

	const isPath = (
		specifier.startsWith(fileProtocol)
		|| isPathPattern.test(specifier)
	);

	if (
		tsconfigPathsMatcher
		&& !isPath // bare specifier
		&& !context.parentURL?.includes('/node_modules/')
	) {
		const possiblePaths = tsconfigPathsMatcher(specifier);
		for (const possiblePath of possiblePaths) {
			try {
				return await resolve(
					pathToFileURL(possiblePath).toString(),
					context,
					defaultResolve,
				);
			} catch {}
		}
	}

	/**
	 * Typescript gives .ts, .cts, or .mts priority over actual .js, .cjs, or .mjs extensions
	 */
	if (tsExtensionsPattern.test(context.parentURL!)) {
		const tsPath = resolveTsPath(specifier);

		if (tsPath) {
			try {
				return await resolve(tsPath, context, defaultResolve, true);
			} catch (error) {
				const { code } = error as any;
				if (
					code !== 'ERR_MODULE_NOT_FOUND'
					&& code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED'
				) {
					throw error;
				}
			}
		}
	}

	let resolved: Resolved;
	try {
		resolved = await defaultResolve(specifier, context, defaultResolve);
	} catch (error) {
		if (
			error instanceof Error
			&& !recursiveCall
		) {
			if ((error as any).code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
				return await tryDirectory(specifier, context, defaultResolve);
			}

			if ((error as any).code === 'ERR_MODULE_NOT_FOUND') {
				return await tryExtensions(specifier, context, defaultResolve);
			}
		}

		throw error;
	}

	if (resolved.url.endsWith('.json')) {
		return {
			...resolved,
			format: 'json',
		};
	}

	let { format } = resolved;

	if (resolved.url.startsWith(fileProtocol)) {
		format = getFormatFromExtension(resolved.url) ?? format;

		if (!format) {
			format = await getPackageType(resolved.url);
		}
	}

	return {
		...resolved,
		format,
	};
};

type load = (
	url: string,
	context: {
		format: string;
		importAssertions: Record<string, string>;
	},
	defaultLoad: load,
) => MaybePromise<{
	format: string;
	source: string | ArrayBuffer | SharedArrayBuffer | Uint8Array;
}>;

export const load: load = async function (
	url,
	context,
	defaultLoad,
) {
	if (process.send) {
		process.send({
			type: 'dependency',
			path: url,
		});
	}

	if (url.endsWith('.json')) {
		if (!context.importAssertions) {
			context.importAssertions = {};
		}
		context.importAssertions.type = 'json';
	}

	const loaded = await defaultLoad(url, context, defaultLoad);

	if (!loaded.source) {
		return loaded;
	}

	const filePath = fileURLToPath(url);
	const code = loaded.source.toString();

	if (
		loaded.format === 'json'
		|| tsExtensionsPattern.test(url)
	) {
		const transformed = await transform(
			code,
			filePath,
			{
				tsconfigRaw: tsconfigRaw as TransformOptions['tsconfigRaw'],
			},
		);

		return {
			format: 'module',
			source: applySourceMap(transformed, url),
		};
	}

	const dynamicImportTransformed = transformDynamicImport(filePath, code);
	if (dynamicImportTransformed) {
		loaded.source = applySourceMap(
			dynamicImportTransformed,
			url,
		);
	}

	return loaded;
};
