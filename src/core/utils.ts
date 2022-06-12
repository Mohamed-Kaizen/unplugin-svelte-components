import { slash } from "@antfu/utils"
import minimatch from "minimatch"
import { parse } from "path"

import { DISABLE_COMMENT } from "./constants"

import type { Context } from "./context"
import type { ImportInfo, ResolvedOptions, ExternalImport } from "../types"

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
		return `import { ${info.name} as ${info.as} } from '${info.from}'`
	else if (!info.defaultImport)
		return `import { ${info.as} } from '${info.from}'`
	else return `import ${info.as} from '${info.from}'`
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
	let filename = parsedFilePath.name

	// set parent directory as filename if it is index
	if (filename === "index" && !directoryAsNamespace) {
		filename = `${folders.slice(-1)[0]}`
		return filename
	}

	if (directoryAsNamespace) {
		// remove namesspaces from folder names
		if (globalNamespaces.some((name: string) => folders.includes(name)))
			folders = folders.filter((f) => !globalNamespaces.includes(f))

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
