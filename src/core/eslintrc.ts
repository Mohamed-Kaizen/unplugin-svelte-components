import type { Context } from "./context"
import { promises as fs } from "fs"
import { notNullish, resolveExternalImports } from "./utils"

export function generateESLintConfigs(ctx: Context) {
	const items = [
		...Object.values({
			...ctx.componentNameMap,
			...ctx.componentCustomMap,
		}),
		...resolveExternalImports(ctx.options.external),
	]

	const imports: Record<string, string> = Object.fromEntries(
		items
			.map(({ as: name }) => {
				if (!name) return undefined
				return [name, ctx.options.eslintrc.globalsPropValue]
			})
			.filter(notNullish)
	)

	const data = JSON.stringify({ globals: imports }, null, 4)

	fs.writeFile(
		ctx.options.eslintrc.filepath ?? "./.eslintrc-components.json",
		data,
		"utf-8"
	)
}
