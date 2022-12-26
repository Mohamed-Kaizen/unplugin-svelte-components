import { createFilter } from "@rollup/pluginutils"
import { slash, throttle, toArray } from "@antfu/utils"
import type fs from "fs"
import { relative } from "path"

import { generateDeclaration } from "./declaration"
import { searchComponents } from "./glob"
import {
	getNameFromFilePath,
	matchGlobs,
	parseId,
	pascalCase,
	resolveAlias,
} from "./utils"
import { resolveOptions } from "./options"
import transformer from "./transformer"

import type { UpdatePayload, ViteDevServer } from "vite"
import type {
	ImportInfo,
	Options,
	ResolvedOptions,
	Transformer,
} from "../types"
import { PreprocessorGroup } from "svelte/types/compiler/preprocess"

export class Context {
	options: ResolvedOptions
	transformer: Transformer = undefined!

	private _componentPaths = new Set<string>()
	private _componentNameMap: Record<string, ImportInfo> = {}
	private _componentUsageMap: Record<string, Set<string>> = {}
	private _componentCustomMap: Record<string, ImportInfo> = {}
	private _server: ViteDevServer | undefined

	root = process.cwd()

	sourcemap: string | boolean = true

	preprocess: PreprocessorGroup | [] = []

	constructor(private rawOptions: Options) {
		this.options = resolveOptions(rawOptions, this.root)
		this.generateDeclaration = throttle(
			500,
			false,
			this.generateDeclaration.bind(this)
		)
		this.transformer = transformer(this)
	}

	setRoot(root: string) {
		if (this.root === root) return
		this.root = root
		this.options = resolveOptions(this.rawOptions, this.root)
	}

	transform(code: string, id: string) {
		const { path, query } = parseId(id)
		return this.transformer(code, id, path, query)
	}

	setupViteServer(server: ViteDevServer) {
		if (this._server === server) return

		this._server = server
		this.setupWatcher(server.watcher)
	}

	setupWatcher(watcher: fs.FSWatcher) {
		const { globs } = this.options

		watcher.on("unlink", (path) => {
			if (!matchGlobs(path, globs)) return

			path = slash(path)
			this.removeComponents(path)
			this.onUpdate(path)
		})
		watcher.on("add", (path) => {
			if (!matchGlobs(path, globs)) return

			path = slash(path)
			this.addComponents(path)
			this.onUpdate(path)
		})
	}

	/**
	 * Record the usage of components
	 * @param path
	 * @param paths paths of used components
	 */
	updateUsageMap(path: string, paths: string[]) {
		if (!this._componentUsageMap[path])
			this._componentUsageMap[path] = new Set()

		paths.forEach((p) => {
			this._componentUsageMap[path].add(p)
		})
	}

	addComponents(paths: string | string[]) {
		const size = this._componentPaths.size

		toArray(paths).forEach((p) => this._componentPaths.add(p))
		if (this._componentPaths.size !== size) {
			this.updateComponentNameMap()
			return true
		}
		return false
	}

	addCustomComponents(info: ImportInfo) {
		if (info.as) this._componentCustomMap[info.as] = info
	}

	removeComponents(paths: string | string[]) {
		const size = this._componentPaths.size
		toArray(paths).forEach((p) => this._componentPaths.delete(p))
		if (this._componentPaths.size !== size) {
			this.updateComponentNameMap()
			return true
		}
		return false
	}

	onUpdate(path: string) {
		this.generateDeclaration()

		if (!this._server) return

		const payload: UpdatePayload = {
			type: "update",
			updates: [],
		}
		const timestamp = +new Date()
		const name = pascalCase(getNameFromFilePath(path, this.options))

		Object.entries(this._componentUsageMap).forEach(([key, values]) => {
			if (values.has(name)) {
				const r = `/${slash(relative(this.root, key))}`
				payload.updates.push({
					acceptedPath: r,
					path: r,
					timestamp,
					type: "js-update",
				})
			}
		})

		if (payload.updates.length) this._server.ws.send(payload)
	}

	private updateComponentNameMap() {
		const filter = createFilter(
			this.options.include || [/\.svelte$/],
			this.options.exclude || [
				/[\\/]node_modules[\\/]/,
				/[\\/]\.git[\\/]/,
				/[\\/]\.svelte-kit[\\/]/,
			]
		)
		this._componentNameMap = {}

		Array.from(this._componentPaths).forEach((path) => {
			if (!filter(path)) return
			const name = pascalCase(getNameFromFilePath(path, this.options))

			if (this._componentNameMap[name] && !this.options.allowOverrides) {
				// eslint-disable-next-line no-console
				console.warn(
					`[unplugin-svelte-components] component "${name}"(${path}) has naming conflicts with other components, ignored.`
				)
				return
			}

			this._componentNameMap[name] = {
				as: name,
				from: path,
				defaultImport: true,
			}
		})
	}

	async findComponent(
		name: string,
		excludePaths: string[] = []
	): Promise<ImportInfo | undefined> {
		// resolve from fs
		const info = this._componentNameMap[name]
		if (
			info &&
			!excludePaths.includes(info.from) &&
			!excludePaths.includes(info.from.slice(1))
		)
			return info
		const external = this.options.external

		if (external.length > 0) {
			const module = external
				?.filter((cp) =>
					cp?.names?.filter((cp_name) => {
						if (cp_name?.includes("as")) {
							return cp_name?.split("as")[1].trim() === name
						}
						return cp_name === name
					}).length > 0
				)
				?.at(0)
			if (!module) return undefined
			const cp_name = module?.names
				?.filter((cp_name) => {
					if (cp_name?.includes("as")) {
						return cp_name?.split("as")[1].trim() === name
					}
					return cp_name === name
				})
				?.at(0)

			if (!cp_name) return undefined

			if (cp_name?.includes("as")) {
				const [, name, alias] = cp_name.match(/^(.*) as (.*)$/) || []

				return {
					as: alias,
					from: module.from,
					name,
					defaultImport: false,
				}
			}
			return {
				as: cp_name,
				from: module.from,
				defaultImport: module.defaultImport,
			}
		}

		return undefined
	}

	normalizePath(path: string) {
		return resolveAlias(
			path,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.viteConfig?.resolve?.alias || this.viteConfig?.alias || []
		)
	}

	_searched = false

	/**
	 * This search for components in with the given options.
	 * Will be called multiple times to ensure file loaded,
	 * should normally run only once.
	 *
	 * @param ctx
	 * @param force
	 */
	searchGlob() {
		if (this._searched) return

		searchComponents(this)

		this._searched = true
	}

	generateDeclaration() {
		if (!this.options.dts) return
		generateDeclaration(this, this.options.dts, !this._server)
	}

	get componentNameMap() {
		return this._componentNameMap
	}

	get componentCustomMap() {
		return this._componentCustomMap
	}
}
