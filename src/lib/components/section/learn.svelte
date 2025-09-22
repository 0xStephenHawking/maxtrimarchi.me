<script lang="ts">
	import { onMount } from 'svelte';
	import knowladge from '@resources/knowladge.json';
	import { MarqueeSlider, MarqueeItem } from '@components/MarqueeSlider';

	let section: HTMLElement;

	knowladge.languages.sort((a, b) => b.lvl - a.lvl);

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries, observer) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						document.querySelectorAll('[data-lang-lvl]')?.forEach((container) => {
							const lvl = (container as HTMLDivElement).dataset?.langLvl;
							const small = container.querySelector('small');
							const progressBar = container.querySelector('progress');

							if (lvl && small && progressBar) {
								small.innerText = `${lvl}%`;
								progressBar.value = parseInt(lvl);
							}
						});

						observer.unobserve(entry.target);
					}
				});
			},
			{ root: null, threshold: 0.1 }
		);

		observer.observe(section);
	});
</script>

<svelte:head>
	<title>M.T. - What I Learned</title>
</svelte:head>

<section id="learn" bind:this={section}>
	<h2>This is what I learned trough out the years.</h2>

	<div class="languages-list">
		{#each knowladge.languages as language}
			<div class="mono" data-lang-lvl={language.lvl}>
				<label for={`p-${language.label}`}>
					<img src={`/logos/${language.img}`} alt={language.label} loading="lazy" />
					{language.label}
				</label>

				<progress
					style={`--pico-transition: 1.75s ease-in-out; --pico-progress-color: ${language.color};`}
					title={language.label}
					id={`p-${language.label}`}
					value={0}
					max="100"
				>
				</progress>

				<noscript>
					<small>{language.lvl}%</small>
				</noscript>

				<small>{0}%</small>
			</div>
		{/each}
	</div>

	<MarqueeSlider style="margin-left: calc(25% / 2)" width="75%">
		{#each knowladge.misc as item}
			<MarqueeItem>
				<img
					src={`/logos/${item.img}`}
					alt={item.label}
					title={item.label}
					height="80px"
					width="80px"
				/>
			</MarqueeItem>
		{/each}
	</MarqueeSlider>
</section>

<style lang="scss">
	@use 'sass:map';
	@use '@picocss/pico/scss/settings' as settings;

	$lg: map.get(map.get(settings.$breakpoints, lg), breakpoint);

	#learn {
		.languages-list {
			display: flex;
			column-gap: 50px;
			margin: 100px 0;
			flex-wrap: wrap;

			progress {
				min-width: 100px;
			}

			img {
				user-select: none;
				height: 45px;
				width: 45px;
			}

			[data-lang-lvl] {
				display: flex;
				flex-direction: column;
				margin-bottom: 2rem;
				flex: 1 1 30%;
				justify-content: space-between;
			}
		}

		@media only screen and (min-width: $lg) {
			height: calc(100vh - 168px);

			.languages-list {
				justify-content: space-evenly;

				[data-lang-lvl] {
					min-width: 250px;
				}
			}

			progress {
				width: 100%;

				@media only screen and (min-width: $lg) {
					max-width: 350px;
					min-width: 250px;
				}
			}
		}
	}
</style>
