<script>
	import welcome from "$lib/images/svelte-welcome.webp"
	import welcome_fallback from "$lib/images/svelte-welcome.png"

	let enabled = false
	console.log(useHi())
</script>

<svelte:head>
	<title>{FO} | Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		<span class="welcome">
			<picture>
				<source srcset={welcome} type="image/webp" />
				<img src={welcome_fallback} alt="Welcome" />
			</picture>
		</span>

		to your new<br />SvelteKit app
	</h1>

	<h2>
		try editing <strong>src/routes/+page.svelte</strong>
	</h2>

	<Counter />
	<ASwitch
		checked={enabled}
		on:change={(e) => (enabled = e.detail)}
		class={enabled ? "switch switch-enabled" : "switch switch-disabled"}
	>
		<span class="sr-only">Enable notifications</span>
		<span
			class="toggle"
			class:toggle-on={enabled}
			class:toggle-off={!enabled}
		/>
	</ASwitch>
	<Switch
		checked={enabled}
		on:change={(e) => (enabled = e.detail)}
		class={enabled ? "switch switch-enabled" : "switch switch-disabled"}
	>
		<span class="sr-only">Enable notifications</span>
		<span
			class="toggle"
			class:toggle-on={enabled}
			class:toggle-off={!enabled}
		/>
	</Switch>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}

	:global(.switch) {
		position: relative;
		display: inline-flex;
		align-items: center;
		border-radius: 9999px;
		height: 1.5rem;
		width: 2.75rem;
	}

	:global(.switch-enabled) {
		/* Blue */
		background-color: rgb(37 99 235);
	}

	:global(.switch-disabled) {
		/* Gray */
		background-color: rgb(229 231 235);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.toggle {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		background-color: rgb(255 255 255);
		border-radius: 9999px;
	}

	.toggle-on {
		transform: translateX(1.1rem);
	}

	.toggle-off {
		transform: translateX(-0.25rem);
	}
</style>
