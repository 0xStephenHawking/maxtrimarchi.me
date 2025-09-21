<script lang="ts">
	let active = false;

	const COLORS = ['#f9c74f', '#90be6d', '#f94144', '#577590', '#43aa8b', '#f8961e'];

	function createConfettiBurst(x: number, y: number, count = 18) {
		if (active) {
			for (let i = 0; i < count; i++) {
				let confetti = document.createElement('div');
				confetti.className = 'confetti';
				confetti.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
				confetti.style.left = `${x - 3}px`;
				confetti.style.top = `${y - 3}px`;
				// Random direction and distance
				let angle = Math.random() * 2 * Math.PI;
				let distance = 40 + Math.random() * 40;
				let dx = Math.cos(angle) * distance;
				let dy = Math.sin(angle) * distance - 20; // slight upward burst
				confetti.style.setProperty('--x', `${dx}px`);
				confetti.style.setProperty('--y', `${dy}px`);
				// Random rotation
				confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
				document.body.appendChild(confetti);
				// Remove after animation
				confetti.addEventListener('animationend', () => confetti.remove());
			}
		}
	}
</script>

<svelte:window on:click={(e) => createConfettiBurst(e.clientX, e.clientY)} />

<button
	class="confetti-mode"
	class:active
	aria-label="Confetti Mode"
	type="button"
	title="Confetti Mode"
	on:click={() => (active = !active)}
>
	<img src="/icons/balloons.svg" alt="@_@" />
</button>

<style lang="scss">
	.confetti-mode {
		padding: 0;
		background-color: transparent;
		border: none;
		box-shadow: none;
		position: fixed;
		right: 30px;
		bottom: 10px;
		opacity: 0.3;
		transition: opacity ease-in-out 150ms;

		&.active {
			opacity: 1;
		}
	}

	:global(.confetti) {
		position: fixed;
		width: 6px;
		height: 6px;
		border-radius: 1px;
		pointer-events: none;
		z-index: 9999;
		will-change: transform, opacity;
		animation: confetti-fall 800ms cubic-bezier(0.49, 0.65, 0.59, 1.01) forwards;

		@keyframes confetti-fall {
			to {
				transform: translate(var(--x), var(--y)) rotate(360deg) scale(0.9);
				opacity: 0;
			}
		}
	}
</style>
