import { createFilter } from "@rollup/pluginutils"
import chokidar from "chokidar"
import { createUnplugin } from "unplugin"

import { Context } from "./context"
import { shouldTransform } from "./utils"

import type { ResolvedConfig, ViteDevServer } from "vite"
import type { Options } from "../types"

export default createUnplugin<Options>((options = {}) => {
	const filter = createFilter(
		options.include || [/\.svelte$/, /\.svelte\?svelte/],
		options.exclude || [
			/[\\/]node_modules[\\/]/,
			/[\\/]\.git[\\/]/,
			/[\\/]\.svelte-kit[\\/]/,
		]
	)
	const ctx: Context = new Context(options)

	return {
		name: "unplugin-svelte-components",
		enforce: "pre",

		transformInclude(id: string) {
			return filter(id)
		},

		async transform(code: string, id: string) {
			if (!shouldTransform(code)) return null
			const result = await ctx.transform(code, id)
			ctx.generateDeclaration()
			return result
		},
		vite: {
			configResolved(config: ResolvedConfig) {
				ctx.setRoot(config.root)

				ctx.sourcemap = true

				if (options.dts) {
					ctx.searchGlob()
					ctx.generateDeclaration()
				}

				if (config.build.watch && config.command === "build")
					ctx.setupWatcher(chokidar.watch(ctx.options.globs))
			},
			configureServer(server: ViteDevServer) {
				ctx.setupViteServer(server)
			},
		},
	}
})
