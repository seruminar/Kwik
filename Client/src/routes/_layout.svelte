<script context="module" lang="ts">
  import type { Preload } from "@sapper/app";
  import type { ISession } from "../shared/session";

  export const preload: Preload<{}, ISession> = async function (
    this,
    page,
    session
  ) {
    session.title = "Kwik";

    session.translations = {
      en_us: {
        translation: {
          questionsInTheBox: "Put questions in the box, one question per line.",
          ask: "Ask",
          askingIn: "Asking in",
          askingInSeconds: "seconds...",
          clickToCopy: "Click an answer to copy it.",
          copied: "Copied!",
        },
      },
    };

    return {};
  };
</script>

<script lang="ts">
  import { stores } from "@sapper/app";
  import { fly } from "svelte/transition";
  import { onMount } from "svelte";

  const { session } = stores<ISession>();

  let ready = false;

  onMount(() => (ready = true));
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta name="theme-color" content="#333333" />
  <link rel="icon" type="image/png" href="favicon.png" />
  <title>{$session.title}</title>
</svelte:head>

{#if ready}
  <h1 in:fly={{ x: 100 }}>{$session.title}</h1>
{:else}
  <h1>&nbsp;</h1>
{/if}
<slot />

<style>
  :global(body) {
    margin: 0;
    font-family: Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
  }

  :global(main) {
    position: relative;
    margin: 0 auto;
    box-sizing: border-box;
  }

  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6) {
    margin: 0 0 0.5em 0;
    line-height: 1.2;
  }

  h1 {
    font-size: 5em;
    text-transform: uppercase;
    font-weight: 700;
    margin: 0 0 0.5em 0.5em;
  }

  :global(a) {
    color: inherit;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(section) {
    display: flex;
    flex-direction: column;
    max-width: 1600px;
    margin: 0 auto;
  }

  @media (max-width: 1600px) {
    :global(section) {
      max-width: 800px;
    }
  }

  @media (max-width: 800px) {
    h1 {
      font-size: 3em;
    }
  }

  @media (min-width: 400px) {
    :global(body) {
      font-size: 16px;
    }
  }
</style>
