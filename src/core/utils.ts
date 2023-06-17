import { minimatch } from "minimatch"
import { parse } from "path"

import { DISABLE_COMMENT } from "./constants"

import type { Context } from "./context"
import type {
	ImportInfo,
	ResolvedOptions,
	ExternalImport,
	Nullable,
	Arrayable,
	FunctionArgs,
	EventFilter,
	AnyFn,
} from "../types"

export function pascalCase(str: string) {
	return capitalize(camelCase(str))
}

export function camelCase(str: string) {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""))
}

export function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export function parseId(id: string) {
	const index = id.indexOf("?")
	if (index < 0) {
		return { path: id, query: {} }
	} else {
		const query = Object.fromEntries(
			new URLSearchParams(id.slice(index)) as any
		)
		return {
			path: id.slice(0, index),
			query,
		}
	}
}

export function isEmpty(value: any) {
	if (
		!value ||
		value === null ||
		value === undefined ||
		(Array.isArray(value) && Object.keys(value).length <= 0)
	)
		return true
	else return false
}

export function matchGlobs(filepath: string, globs: string[]) {
	for (const glob of globs) {
		if (minimatch(slash(filepath), glob)) return true
	}
	return false
}

export function getTransformedPath(path: string, ctx: Context): string {
	if (ctx.options.importPathTransform) {
		const result = ctx.options.importPathTransform(path)
		if (result != null) path = result
	}

	return path
}

export function stringifyImport(info: ImportInfo | string) {
	if (typeof info === "string") return `import '${info}'`
	if (info.name)
		return `import { ${info.name} as ${info.as} } from ${JSON.stringify(
			info.from
		)}`
	else if (!info.defaultImport)
		return `import { ${info.as} } from ${JSON.stringify(info.from)}`
	else return `import ${info.as} from ${JSON.stringify(info.from)}`
}

export function stringifyComponentImport(
	{ as: name, from: path, name: importName, defaultImport }: ImportInfo,
	ctx: Context
) {
	path = getTransformedPath(path, ctx)

	const imports = [
		stringifyImport({
			as: name,
			from: path,
			name: importName,
			defaultImport,
		}),
	]

	return imports.join(";")
}

export function getNameFromFilePath(
	filePath: string,
	options: ResolvedOptions
): string {
	const {
		resolvedDirs,
		directoryAsNamespace,
		globalNamespaces,
		collapseSamePrefixes,
	} = options

	const parsedFilePath = parse(slash(filePath))

	let strippedPath = ""

	// remove include directories from filepath
	for (const dir of resolvedDirs) {
		if (parsedFilePath.dir.startsWith(dir)) {
			strippedPath = parsedFilePath.dir.slice(dir.length)
			break
		}
	}

	let folders = strippedPath.slice(1).split("/").filter(Boolean)
	let filename = parsedFilePath.name.replace(/[^a-zA-Z0-9]/g, "")

	// set parent directory as filename if it is index
	if (filename === "index" && !directoryAsNamespace) {
		filename = `${folders.slice(-1)[0]}`
		return filename
	}

	if (directoryAsNamespace) {
		// remove namesspaces from folder names
		if (globalNamespaces.some((name: string) => folders.includes(name)))
			folders = folders.filter((f) => !globalNamespaces.includes(f))

		folders = folders.map((f) => f.replace(/[^a-zA-Z0-9]/g, ""))

		if (filename.toLowerCase() === "index") filename = ""

		if (!isEmpty(folders)) {
			// add folders to filename
			let namespaced = [...folders, filename]

			if (collapseSamePrefixes) {
				const collapsed: string[] = []

				for (const fileOrFolderName of namespaced) {
					const collapsedFilename = collapsed.join("")
					if (
						collapsedFilename &&
						fileOrFolderName
							.toLowerCase()
							.startsWith(collapsedFilename.toLowerCase())
					) {
						const collapseSamePrefix = fileOrFolderName.slice(
							collapsedFilename.length
						)

						collapsed.push(collapseSamePrefix)
						continue
					}

					collapsed.push(fileOrFolderName)
				}

				namespaced = collapsed
			}

			filename = namespaced.filter(Boolean).join("-")
		}

		return filename
	}

	return filename
}

export function resolveAlias(filepath: string, alias: any) {
	const result = filepath
	if (Array.isArray(alias)) {
		for (const { find, replacement } of alias)
			result.replace(find, replacement)
	}
	return result
}

export function shouldTransform(code: string) {
	if (code.includes(DISABLE_COMMENT)) return false
	return true
}

export function resolveExternalImports(
	imports: ExternalImport[]
): ImportInfo[] {
	return imports.flatMap((i) =>
		i.names.map((n) => {
			let name = n
			let alias = n
			if (n.includes("as")) {
				const [, _name, _alias] = n.match(/^(.*) as (.*)$/) || []
				name = _name
				alias = _alias
			}
			return { from: i.from, name, as: alias }
		})
	)
}

/**
 * Replace backslash to slash
 *
 * @category String
 */
export function slash(str: string): string {
	return str.replace(/\\/g, "/")
}

/**
 * Convert `Arrayable<T>` to `Array<T>`
 *
 * @category Array
 */
export function toArray<T>(array?: Nullable<Arrayable<T>>) {
	array = array || []
	if (Array.isArray(array)) return array
	return [array]
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {}

/**
 * Create an EventFilter that throttle the events
 *
 * @param s - The time to wait before invoking the function in seconds
 *
 * @param trailing - Whether to invoke the function on the trailing edge of the wait interval
 *
 * @param leading - Whether to invoke the function on the leading edge of the wait interval
 *
 * @param reject_on_cancel - Whether to reject the promise when the event is cancelled
 */
export function throttle_filter(
	s: number,
	trailing = true,
	leading = true,
	reject_on_cancel = false
) {
	let last_exec = 0

	let timer: ReturnType<typeof setTimeout> | undefined

	let is_leading = true

	let last_rejector: AnyFn = noop

	let last_value: any

	const clear = () => {
		if (timer) {
			clearTimeout(timer)
			timer = undefined
			last_rejector()
			last_rejector = noop
		}
	}

	const filter: EventFilter = (_invoke) => {
		const duration = s * 1000

		const elapsed = Date.now() - last_exec

		const invoke = () => {
			return (last_value = _invoke())
		}

		clear()

		if (duration <= 0) {
			last_exec = Date.now()
			return invoke()
		}

		if (elapsed > duration && (leading || !is_leading)) {
			last_exec = Date.now()
			invoke()
		} else if (trailing) {
			return new Promise((resolve, reject) => {
				last_rejector = reject_on_cancel ? reject : resolve
				timer = setTimeout(() => {
					last_exec = Date.now()
					is_leading = true
					resolve(invoke())
					clear()
				}, duration - elapsed)
			})
		}

		if (!leading && !timer)
			timer = setTimeout(() => (is_leading = true), duration)

		is_leading = false

		return last_value
	}

	return filter
}

/**
 * Create a wrapper function that will apply the filter to the function
 *
 * @internal
 *
 * @param filter - The filter to be applied
 *
 * @param fn - The function to be wrapped
 *
 * @returns A wrapped function
 */
export function create_filter_wrapper<T extends FunctionArgs>(
	filter: EventFilter,
	fn: T
) {
	function wrapper(this: any, ...args: any[]) {
		filter(() => fn.apply(this, args), { fn, this_arg: this, args })
	}

	return wrapper as any as T
}

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param fn - A function to be executed after delay seconds debounced.
 *
 * @param s - The time to wait before invoking the function in seconds
 *
 * @param trailing - If true, call fn again after the time is up
 *
 * @param leading - if true, call fn on the leading edge of the s timeout
 *
 * @returns A new debounce function.
 */
export function throttle<T extends FunctionArgs>(
	fn: T,
	s = 0.2,
	trailing = false,
	leading = true
): T {
	return create_filter_wrapper(throttle_filter(s, trailing, leading), fn)
}

/**
 * Type guard to filter out null-ish values
 *
 * @category Guards
 * @example array.filter(notNullish)
 */
export function notNullish<T>(v: T | null | undefined): v is NonNullable<T> {
	return v != null
}
