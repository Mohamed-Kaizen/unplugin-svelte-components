import unplugin from "."

import type { Plugin } from "vite"
import type { Options, PublicPluginAPI } from "./types"

export default unplugin.vite as (
	options?: Options | undefined
) => Plugin & { api: PublicPluginAPI }
