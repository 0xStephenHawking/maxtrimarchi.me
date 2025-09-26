<script lang="ts">
	import { onMount } from 'svelte';
	import knowladge from '@resources/knowladge.json';

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
	<h2>This is what I have learned over the years.</h2>

	<div class="languages-list d-flex flex-wrap">
		{#each knowladge.languages as language}
			<div class="d-flex-col mono" data-lang-lvl={language.lvl}>
				<label for={`p-${language.label}`}>
					<img class="icon" src={`/logos/${language.img}`} alt={language.label} loading="lazy" />
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

	<div class="d-flex flex-wrap gap-3 justify-center">
		{#each knowladge.misc as language}
			<div class="mono">
				<img class="icon" src={`/logos/${language.img}`} alt={language.label} loading="lazy" />
				{language.label}
			</div>
		{/each}
	</div>
</section>

<style lang="scss">
	@use 'sass:map';
	@use '@picocss/pico/scss/settings' as settings;

	$lg: map.get(map.get(settings.$breakpoints, lg), breakpoint);

	#learn {
		.languages-list {
			column-gap: 50px;
			margin-top: 50px;

			progress {
				min-width: 100px;
			}

			img {
				user-select: none;
			}

			[data-lang-lvl] {
				margin-bottom: 2rem;
				flex: 1 1 30%;
				justify-content: space-between;
			}
		}

		@media only screen and (min-width: $lg) {
			height: calc(100vh - 168px);

			.languages-list {
				justify-content: space-evenly;
				margin: 100px 0 50px 0;

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
