<script lang="ts">
	import Hero from '@components/section/hero.svelte';
	import Learn from '@components/section/learn.svelte';
</script>

<Hero />
<Learn />

<style lang="scss">
	@use 'sass:map';
	@use '@picocss/pico/scss/settings' as settings;

	$lg: map.get(map.get(settings.$breakpoints, lg), breakpoint);

	@media only screen and (min-width: $lg) {
		:global(section:not(#hero)) {
			padding: 50px;
		}
	}
</style>
