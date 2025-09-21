<svelte:head>
	<title>M.T. - Hi</title>
</svelte:head>

<section id="hero">
	<hgroup>
		<h1>HI.</h1>
		<h2>Self-tought software developer<span>|</span></h2>
	</hgroup>

	<a aria-label="Next section" href="#learn" class="contrast">
		<button aria-label="Next section">
			<svg
				width="50px"
				height="50px"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M20 7V8.2C20 9.88016 20 10.7202 19.673 11.362C19.3854 11.9265 18.9265 12.3854 18.362 12.673C17.7202 13 16.8802 13 15.2 13H4M4 13L8 9M4 13L8 17"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</a>
</section>

<style lang="scss">
	#hero {
		height: calc(100vh - (125px + 20px));

		hgroup {
			margin-top: 10%;

			& > h1 {
				font-size: 145px;
			}

			& > h2 {
				font-size: 65px !important;
				text-transform: capitalize;
			}

			span {
				display: inline-block;
				width: 10px;
				animation: blink 1.85s steps(2, start) infinite;
				font-weight: bold;

				@keyframes blink {
					0%,
					50% {
						opacity: 1;
					}

					50.01%,
					100% {
						opacity: 0;
					}
				}
			}
		}

		& > a > button {
			min-width: 25%;
		}
	}
</style>
