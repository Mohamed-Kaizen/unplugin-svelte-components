import { describe, expect, it } from "vitest"
import { Context } from "../src/core/context"
import { stringifyComponentImport } from "../src/core/utils"

describe("stringifyComponentImport", () => {
	it("importName", async () => {
		const ctx = new Context({})
		expect(
			stringifyComponentImport(
				{
					as: "Test",
					from: "test",
					name: "a",
					defaultImport: false,
				},
				ctx
			)
		).toMatchSnapshot()
	})

	it("default import", async () => {
		const ctx = new Context({})
		expect(
			stringifyComponentImport(
				{
					as: "Test",
					from: "test",
					defaultImport: true,
				},
				ctx
			)
		).toMatchSnapshot()
	})

	it("not default import", async () => {
		const ctx = new Context({})
		expect(
			stringifyComponentImport(
				{
					as: "Test",
					from: "test",
					defaultImport: false,
				},
				ctx
			)
		).toMatchSnapshot()
	})
})
