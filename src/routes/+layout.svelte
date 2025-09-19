<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import '@styles/base.scss';

	injectSpeedInsights();
</script>

<svelte:head>
	<title>MaxTrimarchi - Hi</title>
</svelte:head>

<main class="container">
	<slot />
</main>
