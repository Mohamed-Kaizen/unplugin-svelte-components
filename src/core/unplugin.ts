import { createFilter } from "@rollup/pluginutils"
import chokidar from "chokidar"
import path from "path"
import { createUnplugin } from "unplugin"
import { pathToFileURL } from "url"

import { Context } from "./context"
import { shouldTransform } from "./utils"

import type { PreprocessorGroup } from "svelte/types/compiler/preprocess"
import type { ResolvedConfig, ViteDevServer } from "vite"
import type { Options } from "../types"

export default createUnplugin<Options>((options = {}) => {
	const filter = createFilter(
		options.include || [/\.svelte$/],
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
			if (!code) return null
			if (!shouldTransform(code)) return null
			const result = await ctx.transform(code, id)
			ctx.generateDeclaration()
			ctx.generateESLintConfigs()
			return result
		},
		vite: {
			async configResolved(config: ResolvedConfig) {
				const configFile = path.join(config.root, "./svelte.config.js")

				const pkg =
					process.platform === "win32"
						? await import(pathToFileURL(configFile).toString())
						: await import(configFile)

				const preprocess: PreprocessorGroup | [] =
					pkg.default.preprocess || []

				ctx.preprocess = preprocess

				ctx.setRoot(config.root)

				ctx.sourcemap = true

				if (options.dts) {
					ctx.searchGlob()
					ctx.generateDeclaration()
				}
				if (options.eslintrc?.enabled) {
					ctx.generateESLintConfigs()
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
