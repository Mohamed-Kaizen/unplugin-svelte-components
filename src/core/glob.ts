import fg from "fast-glob"

import type { Context } from "./context"

export function searchComponents(ctx: Context) {
	const root = ctx.root

	const files = fg.sync(ctx.options.globs, {
		ignore: ["node_modules"],
		onlyFiles: true,
		cwd: root,
		absolute: true,
	})

	if (!files.length && !ctx.options.resolvers?.length)
		// eslint-disable-next-line no-console
		console.warn("[unplugin-svelte-components] no components found")

	ctx.addComponents(files)
}
