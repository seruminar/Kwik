<script lang="ts">
  import { property } from "../actions/property";
  import { translate } from "../stores/translate";
  import { fly } from "svelte/transition";
  import type { IAnswer, IAnswerGroup } from "../../routes/index.svelte";

  export let answerGroup: IAnswerGroup;
  export let showQuestions: boolean = false;
  export let click: (
    answer: IAnswer
  ) => svelte.JSX.MouseEventHandler<HTMLDivElement>;
  export let open: boolean = true;

  const t = translate({
    en_us: {
      translation: {
        questionsInTheBox: "Put questions here...",
        numberOfAnswers: "Number of answers to fetch:",
        showQuestions: "Show original questions?",
        collapsePrevious: "Collapse previous questions?",
        clickToCopy: "Click to copy to clipboard.",
        copied: "copied to clipboard",
      },
    },
  });
</script>

<div transition:fly={{ y: -50 }}>
  <div class="group">
    <div class="question">{answerGroup.question}</div>
    <div class="item" />
    <button class:open on:click={() => (open = !open)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"
        ><path
          d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z" /></svg>
      <span />
    </button>
  </div>
  {#if open}
    {#each answerGroup.answers as answer}
      <div class="group" transition:fly={{ y: -10 }}>
        {#if showQuestions}
          <div class="narrow item">
            {#each answer.questions as question}
              <span>{question}</span>
            {/each}
          </div>
        {/if}
        <div
          class="answer group item"
          title={$t`clickToCopy`}
          use:property={["opacity", answer.score]}
          on:click={click(answer)}>
          <span>
            {answer.answer}
          </span>
          <div class="copy item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"
              ><path
                d="M433.941 65.941l-51.882-51.882A48 48 0 0 0 348.118 0H176c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48v-48h80c26.51 0 48-21.49 48-48V99.882a48 48 0 0 0-14.059-33.941zM266 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h74v224c0 26.51 21.49 48 48 48h96v42a6 6 0 0 1-6 6zm128-96H182a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h106v88c0 13.255 10.745 24 24 24h88v202a6 6 0 0 1-6 6zm6-256h-64V48h9.632c1.591 0 3.117.632 4.243 1.757l48.368 48.368a6 6 0 0 1 1.757 4.243V112z" /></svg>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .group {
    display: flex;
    margin-bottom: 0.5em;
  }

  .column {
    flex-direction: column;
  }

  .item {
    flex: 1;
  }

  .question {
    font-weight: 800;
    font-size: 1.5em;
    color: #00a2ff;
    margin: 0 0 0.5em 0;
  }

  button {
    height: 1.5em;
    border: none;
    background: none;
    outline: none;
    font-size: 2em;
    width: 1.5em;
    display: flex;
    cursor: pointer;
    padding: 0.2em;
  }

  button svg {
    width: 100%;
    height: 100%;
    transition: transform 0.3s;
    transform: rotate(90deg);
    fill: #848484;
  }

  button:hover:not(.open) svg {
    fill: #00a2ff;
  }

  button.open svg {
    fill: #00a2ff;
    transform: rotate(0deg);
  }

  .answer {
    background: hsl(200, 19%, 98%);
    border-radius: 0.5em;
    padding: 0.5em;
    opacity: var(--opacity);
    font-weight: 500;
  }

  .answer:hover {
    background: #6cd5ff60;
    opacity: 1;
    cursor: copy;
    color: #00a2ff;
  }

  .answer .copy {
    text-align: right;
  }

  .answer .copy svg {
    width: 1em;
    fill: #848484;
  }

  .answer:hover .copy svg {
    fill: #00a2ff;
  }

  .narrow {
    flex: 0.2;
    font-size: 0.8em;
    font-weight: 600;
    position: relative;
  }

  .narrow:before {
    content: "";
    height: 100%;
    width: 100%;
    position: absolute;
    background: linear-gradient(
      135deg,
      hsl(210deg 25% 95% / 0),
      hsl(210deg 25% 95%)
    );
  }
</style>
