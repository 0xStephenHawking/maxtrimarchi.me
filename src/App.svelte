<script lang="ts">
  import GithubLink from './lib/GithubLink.svelte'
  import { loadRapier } from './lib/physics'
  import Playground from './lib/Playground.svelte'
  import Unsupported from './lib/Unsupported.svelte'

  const rapier = loadRapier().catch((error) => {
    console.error(error)
    throw error
  })
</script>

{#await rapier then rapier}
  <Playground {rapier} />
{:catch}
  <Unsupported />
{/await}

<GithubLink />
