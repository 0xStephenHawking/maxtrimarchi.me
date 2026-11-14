<script lang="ts">
  import GithubLink from './lib/GithubLink.svelte'
  import { loadRapier } from './lib/physics'
  import Playground from './lib/Playground.svelte'
  import Unsupported from './lib/Unsupported.svelte'

  /** Starts the Rapier download after first paint so it does not compete with LCP. */
  function deferRapier() {
    return new Promise<Awaited<ReturnType<typeof loadRapier>>>((resolve, reject) => {
      const start = () => {
        loadRapier().then(resolve, reject)
      }
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(start, { timeout: 1200 })
      } else {
        window.setTimeout(start, 0)
      }
    })
  }

  const rapier = deferRapier().catch((error) => {
    console.error(error)
    throw error
  })
</script>

<main>
  <!-- Visually hidden page title for screen readers / document outline. -->
  <h1 class="sr-only">MT</h1>

  {#await rapier then rapier}
    <Playground {rapier} />
  {:catch}
    <Unsupported />
  {/await}
  
  <GithubLink />
</main>

<style>
  main {
    position: fixed;
    inset: 0;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
