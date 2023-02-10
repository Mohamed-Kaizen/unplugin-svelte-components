import { walk } from "estree-walker"
import MagicString from "magic-string"
import { parse, preprocess } from "svelte/compiler"

import { stringifyComponentImport } from "./utils"

import type { Ast } from "svelte/types/compiler/interfaces"
import type { TransformResult } from "unplugin"
import type { Context } from "./context"
import type { Transformer } from "../types"

export default function transformer(ctx: Context): Transformer {
	return async (code, id, path) => {
		ctx.searchGlob()

		const sfcPath = ctx.normalizePath(path)

		const s = new MagicString(code)

		await transformComponent(code, s, ctx, sfcPath, id)

		const result: TransformResult = { code: s.toString() }

		if (ctx.sourcemap)
			result.map = s.generateMap({ source: id, includeContent: true })
		return result
	}
}

function walkAST(ast: Ast) {
	const components = new Set()
	if (ast.html && ast.html.children) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		walk(ast.html.children, {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			enter(node: any) {
				if (
					node.type == "InlineComponent" &&
					!/^svelte:/.test(node.name)
				) {
					components.add(node.name)
				}
			},
		})
	}
	return components
}

const resolveSvelte = (ast: Ast) => {
	const results: string[] = []

	const components = walkAST(ast)

	for (const match of components) {
		results.push(`${match}`)
	}

	return results
}

async function transformComponent(
	code: string,
	s: MagicString,
	ctx: Context,
	sfcPath: string,
	filename: string
) {
	if (ctx.preprocess) {
		const processed = await preprocess(code, ctx.preprocess, { filename })
		code = processed.code
	}
	const ast = parse(code)

	const results = resolveSvelte(ast)

	let imports = []

	for (const name of results) {
		ctx.updateUsageMap(sfcPath, [name])

		const component = await ctx.findComponent(name, [sfcPath])

		if (component) {
			imports.push(
				stringifyComponentImport({ ...component, as: name }, ctx)
			)
		}
	}

	if (ast.instance) {
		const start = ast.instance.start

		const index = start + (code.slice(start).indexOf(">") + 2)

		const oc = s.toString()

		imports = imports.filter((item) => {
			const exists =
                oc.includes(item) || oc.includes(item.replace(/'/g, '"')) || oc.includes(item.replace(/"/g, "'"));
			if (exists) return

			return item
		})

		s.overwrite(index, index + 1, `\n ${imports.join("\n")} \n`)
	} else {
		const script = `<script>${imports.join("\n")}</script>`

		s.appendLeft(ast.html.start, script)
	}
}
