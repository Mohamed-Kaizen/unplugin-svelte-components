import { slash, toArray } from "@antfu/utils"
import { join, resolve } from "path"
import { isPackageExists } from "local-pkg"

import type {
	Options,
	ResolvedOptions,
	ComponentResolver,
	ComponentResolverObject,
} from "../types"

export const defaultOptions: Omit<
	Required<Options>,
	"include" | "exclude" | "globs" | "external"
> = {
	dirs: "src/components",

	extensions: "svelte",

	deep: true,

	dts: isPackageExists("typescript"),

	directoryAsNamespace: false,

	globalNamespaces: [],

	importPathTransform: (v) => v,

	allowOverrides: false,

	collapseSamePrefixes: false,
}

function normalizeResolvers(
	resolvers: (ComponentResolver | ComponentResolver[])[]
): ComponentResolverObject[] {
	return toArray(resolvers)
		.flat()
		.map((r) =>
			typeof r === "function" ? { resolve: r, type: "component" } : r
		)
}

export function resolveOptions(
	options: Options,
	root: string
): ResolvedOptions {
	const resolved = Object.assign(
		{},
		defaultOptions,
		options
	) as ResolvedOptions
	resolved.resolvers = normalizeResolvers(resolved.resolvers)
	resolved.extensions = toArray(resolved.extensions)

	if (resolved.globs) {
		resolved.globs = toArray(resolved.globs).map((glob: string) =>
			slash(resolve(root, glob))
		)
		resolved.resolvedDirs = []
	} else {
		const extsGlob =
			resolved.extensions.length === 1
				? resolved.extensions
				: `{${resolved.extensions.join(",")}}`

		resolved.dirs = toArray(resolved.dirs)
		resolved.resolvedDirs = resolved.dirs.map((i) =>
			slash(resolve(root, i))
		)

		resolved.globs = resolved.resolvedDirs.map((i) =>
			resolved.deep
				? slash(join(i, `**/*.${extsGlob}`))
				: slash(join(i, `*.${extsGlob}`))
		)

		if (!resolved.extensions.length)
			throw new Error(
				"[unplugin-svelte-components] `extensions` option is required to search for components"
			)
	}

	resolved.dts = !resolved.dts
		? false
		: resolve(
				root,
				typeof resolved.dts === "string"
					? resolved.dts
					: "components.d.ts"
		  )

	resolved.external = resolved.external || []
	resolved.root = root

	return resolved
}
