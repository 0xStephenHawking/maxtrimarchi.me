<script lang="ts">
	import { onMount } from 'svelte';

	export let speed: number = 50; // px per second
	export let gap: number = 48; // px gap between items
	export let width = '100%';

	let container: HTMLDivElement;
	let content: HTMLDivElement;
	let animationDuration = 0;

	// Used for cloning items to create seamless loop
	let items: Element[] = [];

	onMount(() => {
		if (!container || !content) return;

		// Get all direct children of slot
		items = Array.from(content.children);

		// Calculate width of all items + gap
		const itemWidths = items.map((item) => (item as HTMLElement).offsetWidth);
		const totalWidth = itemWidths.reduce((acc, w) => acc + w, 0) + gap * (items.length - 1);

		// Set animation duration based on speed prop
		animationDuration = totalWidth / speed;

		// Clone the children for seamless loop
		for (const item of items) {
			const clone = item.cloneNode(true) as HTMLElement;

			clone.setAttribute('aria-hidden', 'true');
			content.appendChild(clone);
		}
	});
</script>

<div class="marquee-slider" style:width bind:this={container} {...$$restProps}>
	<div
		class="marquee-content"
		bind:this={content}
		style="--marquee-gap: {gap}px; --marquee-duration: {animationDuration}s"
	>
		<slot />
	</div>
</div>

<style lang="scss">
	.marquee-slider {
		overflow: hidden;
		width: 100%;
		position: relative;
		display: flex;
		justify-content: center;

		.marquee-content {
			display: flex;
			gap: var(--marquee-gap, 48px);
			width: max-content;
			animation: marquee var(--marquee-duration, 10s) linear infinite;
			will-change: transform;
		}

		&:hover .marquee-content {
			animation-play-state: paused;
		}
	}

	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(calc(-50%));
		}
	}
</style>
