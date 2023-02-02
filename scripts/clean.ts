import fg from "fast-glob"
import fs from "fs"
import path from "path"
import { fileURLToPath as file_url_to_path } from "url"

const current_path = path.dirname(file_url_to_path(import.meta.url))

export const DIR_ROOT = path.resolve(current_path, "../")
export const DIR_SRC = path.resolve(DIR_ROOT, "src")

/**
 * @remarks  Clear all build files.
 */
export async function clear() {
	const files = await fg(["*.js", "*.mjs", "*.d.ts"], {
		cwd: DIR_ROOT,
		ignore: ["_*", "dist", "node_modules"],
	})

	for (const file of files) {
		const filepath = path.join(DIR_ROOT, file)

		fs.unlink(filepath, (err) => {
			if (err) {
				console.error(err)
				return
			}
		})
	}
}

clear()
