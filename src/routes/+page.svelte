<script lang="ts">
	type Confetti = {
		id: number;
		x: number;
		y: number;
		color: string;
		r: number;
		s: number;
		vx: number;
		vy: number;
		g: number;
		o: number;
		d: number;
	};

	let confettis: Confetti[] = [];
	let showMessage: boolean = false;
	let exploding: boolean = false;

	const colors: string[] = [
		'#ff595e',
		'#ffca3a',
		'#8ac926',
		'#1982c4',
		'#6a4c93',
		'#f7b801',
		'#ea3546',
		'#662e9b',
		'#43b929',
		'#fdc500'
	];

	function random(a: number, b: number): number {
		return a + Math.random() * (b - a);
	}

	function explodeConfetti(): void {
		if (exploding) return;
		exploding = true;
		showMessage = false;
		confettis = Array.from(
			{ length: 40 },
			(_, i): Confetti => ({
				id: i,
				x: 50,
				y: 90,
				color: colors[Math.floor(Math.random() * colors.length)],
				r: random(0, 360),
				s: random(0.7, 1.3),
				vx: random(-24, 24),
				vy: random(-38, -16),
				g: random(0.3, 0.7),
				o: 1,
				d: random(1000, 1600)
			})
		);
		animate();
	}

	function animate(): void {
		let start: number;
		function frame(ts: number): void {
			if (!start) start = ts;
			const e = ts - start;
			let done = true;
			confettis = confettis.map((c): Confetti => {
				if (e < c.d) {
					c.x += c.vx * 0.06;
					c.y += c.vy * 0.06;
					c.vy += c.g;
					c.r += c.vx * 0.18;
					c.o = 1 - e / c.d;
					done = false;
				} else c.o = 0;
				return c;
			});
			if (!done) requestAnimationFrame(frame);
			else {
				showMessage = true;
				exploding = false;
			}
		}
		requestAnimationFrame(frame);
	}
</script>

<div>
	{#each confettis as c (c.id)}
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div
			class="confetti"
			style="
        left:{c.x}vw;top:{c.y}vh;
        background:{c.color};
        opacity:{c.o};
        transform:rotate({c.r}deg) scale({c.s});"
		/>
	{/each}
	<div class="button-wrapper">
		<button on:click={explodeConfetti} disabled={exploding}>Explode Confetti!</button>
	</div>
	{#if showMessage}
		<div class="final-message">
			🎊 Congratulations! <br /> Sei un coglione!
		</div>
	{/if}
</div>

<style lang="scss">
	.confetti {
		position: absolute;
		width: 12px;
		height: 20px;
		border-radius: 3px;
		pointer-events: none;
	}
	.final-message {
		position: absolute;
		left: 50%;
		top: 40%;
		transform: translate(-50%, -50%);
		font-size: 2rem;
		font-weight: bold;
		color: #444;
		background: #fff9;
		padding: 1rem 2rem;
		border-radius: 10px;
		box-shadow: 0 4px 16px #0002;
		opacity: 0;
		animation: fadeIn 1s forwards;
	}
	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}
	.button-wrapper {
		position: absolute;
		left: 50%;
		top: 90%;
		transform: translate(-50%, -50%);
	}
</style>
