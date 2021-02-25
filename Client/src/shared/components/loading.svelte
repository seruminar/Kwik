<script lang="ts">
  import { fade } from "svelte/transition";
</script>

<div class="root" in:fade>
  <div class="loading">
    <span class="letter">k</span>
    <span class="letter">w</span>
    <span class="letter">i</span>
    <span class="letter">k</span>
  </div>
</div>

<style>
  .root {
    display: flex;
    height: 100%;
    flex-grow: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .loading {
    width: 10em;
    /* animation: loading 6s ease; */
    text-align: center;
    color: #00a2ff;
  }

  @keyframes loading {
    0% {
      opacity: 0;
      transform: translate(0) scaleX(0.01);
    }

    10% {
      opacity: 0.2;
      transform: translate(0) scaleX(0.01);
    }

    14% {
      opacity: 1;
      transform: translate(0) scale(1);
    }

    to {
      opacity: 1;
      transform: translate(0) scale(1);
    }
  }

  .letter {
    animation: letter 1s ease infinite;
    font-size: 2em;
    font-weight: 600;
    text-transform: uppercase;
    display: inline-block;
  }

  .letter:nth-child(1) {
    animation-delay: 0s;
  }

  .letter:nth-child(2) {
    animation-delay: 0.25s;
  }

  .letter:nth-child(3) {
    animation-delay: 0.5s;
  }

  .letter:nth-child(4) {
    animation-delay: 0.75s;
  }

  @keyframes letter {
    0% {
      opacity: 100%;
      transform: scale(1);
    }
    25% {
      transform: scale(1.2);
    }
    50% {
      opacity: 0%;
      transform: scale(1);
    }
    75% {
      transform: scale(1.2);
    }
    100% {
      opacity: 100%;
      transform: scale(1);
    }
  }
</style>
