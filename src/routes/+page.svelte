<script lang="ts">
	import Hero from '@components/section/hero.svelte';
	import Learn from '@components/section/learn.svelte';
</script>

<Hero />
<Learn />

<style lang="scss">
	:global(section:not(#hero)) {
		padding: 50px;
	}
</style>
