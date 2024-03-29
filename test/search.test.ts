import { relative, resolve } from "pathe"
import { describe, expect, it } from "vitest"
import { Context } from "../src/core/context"

const root = resolve(__dirname, "../playground/kit")

function cleanup(data: any) {
	return Object.values(data)
		.map((e: any) => {
			delete e.absolute
			e.from = relative(root, e.from).replace(/\\/g, "/")
			return e
		})
		.sort((a, b) => (a.as as string).localeCompare(b.as))
}

describe("search", () => {
	it("should work", async () => {
		const ctx = new Context({
			exclude: [
				/[\\/]node_modules[\\/]/,
				/[\\/]\.git[\\/]/,
				/[\\/]\.svelte-kit[\\/]/,
				/\.stories\.svelte$/,
				/\.story\.svelte$/,
			],
		})

		ctx.setRoot(root)

		ctx.searchGlob()

		expect(cleanup(ctx.componentNameMap)).toMatchSnapshot()
	})

	it("should with namespace", async () => {
		const ctx = new Context({
			directoryAsNamespace: true,
			globalNamespaces: ["global"],
			exclude: [
				/[\\/]node_modules[\\/]/,
				/[\\/]\.git[\\/]/,
				/[\\/]\.svelte-kit[\\/]/,
				/\.stories\.svelte$/,
				/\.story\.svelte$/,
			],
		})

		ctx.setRoot(root)

		ctx.searchGlob()

		expect(cleanup(ctx.componentNameMap)).toMatchSnapshot()
	})

	it("should with namespace & collapse", async () => {
		const ctx = new Context({
			directoryAsNamespace: true,
			collapseSamePrefixes: true,
			globalNamespaces: ["global"],
			exclude: [
				/[\\/]node_modules[\\/]/,
				/[\\/]\.git[\\/]/,
				/[\\/]\.svelte-kit[\\/]/,
				/\.stories\.svelte$/,
				/\.story\.svelte$/,
			],
		})

		ctx.setRoot(root)

		ctx.searchGlob()

		expect(cleanup(ctx.componentNameMap)).toMatchSnapshot()
	})
})
