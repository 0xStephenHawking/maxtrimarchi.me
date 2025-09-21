<script lang="ts">
	export let as: string = 'div';
</script>

<svelte:element this={as} class="marquee-slider-item">
	<slot />
</svelte:element>

<style lang="scss">
	.marquee-slider-item {
		display: flex;
		align-items: center;
		user-select: none;
	}
</style>
