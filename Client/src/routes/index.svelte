<script context="module" lang="ts">
  export interface IAnswer {
    answer: string;
    questions: string[];
    score: number;
    id: number;
  }

  export interface IAnswerGroup {
    question: string;
    answers: IAnswer[];
    id: number;
  }
</script>

<script lang="ts">
  import { translate } from "../shared/stores/translate";
  import { property } from "../shared/actions/property";
  import { debounce, throttle } from "lodash";
  import wretch from "wretch";
  import { fly } from "svelte/transition";
  import { flip } from "svelte/animate";
  import Loading from "../shared/components/loading.svelte";
  import type { IQnASearchResultList } from "../shared/qnaMaker";
  import { onMount } from "svelte";
  import { localStorage } from "../shared/stores/localStorage";
  import Answer from "../shared/components/answer.svelte";

  enum LocalStorageKeys {
    SavedExport = "Kwik:ShowQuestions",
    AnswerCount = "Kwik:AnswerCount",
    CollapsePrevious = "Kwik:CollapsePrevious",
  }

  interface IQuestionAnswer {
    question: string;
    answer: IAnswer;
  }

  let answerGroups: IAnswerGroup[] = [];
  let collapsedAnswerGroupIds: number[] = [];
  let questionAnswers: Map<number, IQuestionAnswer> = new Map<
    number,
    IQuestionAnswer
  >();

  let questions: string = "";
  let copied: { top: string; left: string };
  let loading: boolean;
  let ready = false;

  $: answerCountStore = localStorage<number>(LocalStorageKeys.AnswerCount, 5);
  $: answerCountStore.set(answerCount);
  $: answerCount = $answerCountStore;

  $: showQuestionsStore = localStorage<boolean>(
    LocalStorageKeys.SavedExport,
    false
  );
  $: showQuestionsStore.set(showQuestions);
  $: showQuestions = $showQuestionsStore;

  $: collapsePreviousStore = localStorage<boolean>(
    LocalStorageKeys.CollapsePrevious,
    false
  );
  $: collapsePreviousStore.set(collapsePrevious);
  $: collapsePrevious = $collapsePreviousStore;

  onMount(() => (ready = true));

  $: questions !== "" && debounceQuestions(questions);

  const debounceQuestions = debounce(
    (oldQuestions: string) =>
      questions === oldQuestions && loadData(oldQuestions),
    500
  );

  const loadData = async (newQuestions: string) => {
    questions = "";
    loading = true;

    const questionsToSend = newQuestions
      .split(/\r?[\n\?]/)
      .filter((line) => line !== "")
      .reverse();

    if (collapsePrevious) {
      collapsedAnswerGroupIds = answerGroups.map(
        (answerGroup) => answerGroup.id
      );
    }

    for (const question of questionsToSend) {
      const response = await wretch("qnaMaker/answer")
        .post({
          question: `${question}?`,
          rankerType: "QuestionOnly",
          top: answerCount,
        })
        .json<IQnASearchResultList>();

      const maxScore = response.answers[0].score;

      answerGroups = [
        {
          question: `${question}?`,
          answers: response.answers.map((answer) => ({
            answer: answer.answer,
            questions: answer.questions,
            score: answer.score / maxScore / 2 + 0.5,
            id: answer.id,
          })),
          id: Date.now(),
        },
        ...answerGroups,
      ];
    }

    loading = false;
  };

  const copy = (question: string) => (answer: IAnswer) => async (
    event: MouseEvent & {
      currentTarget: HTMLDivElement;
    }
  ) => {
    copied = {
      top: `${event.pageY}px`,
      left: `${event.pageX}px`,
    };

    const temporaryElement = document.createElement("p");

    temporaryElement.contentEditable = "true";
    temporaryElement.textContent = event.currentTarget.textContent;

    event.currentTarget.parentElement.appendChild(temporaryElement);
    temporaryElement.focus();
    document.execCommand("selectAll");
    document.execCommand("copy");
    event.currentTarget.parentElement.removeChild(temporaryElement);

    questionAnswers.set(answer.id, { question, answer });
    trainThrottle();
  };

  const trainThrottle = throttle(
    async () => {
      await wretch("qnaMaker/train").post({
        feedbackRecords: [...questionAnswers.values()].map((trainingPair) => ({
          userQuestion: trainingPair.question,
          qnaId: trainingPair.answer.id,
        })),
      });

      questionAnswers = new Map<number, IQuestionAnswer>();
    },
    5000,
    { leading: false }
  );

  const t = translate({
    en_us: {
      translation: {
        questionsInTheBox: "Put questions here...",
        numberOfAnswers: "Number of answers to fetch:",
        showQuestions: "Show original questions?",
        collapsePrevious: "Collapse previous questions?",
        copied: "copied to clipboard",
      },
    },
  });
</script>

<svelte:head>
  <title>Kwik</title>
</svelte:head>

{#if ready}
  <h1>
    <span in:fly={{ x: 100, duration: 500 }}>K</span><span
      in:fly={{ x: 200, duration: 600 }}>w</span
    ><span in:fly={{ x: 300, duration: 800 }}>i</span><span
      in:fly={{ x: 400, duration: 1100 }}>k</span>
  </h1>
{:else}
  <h1>&nbsp;</h1>
{/if}
<section>
  <div class="questions">
    <div class="sticky">
      {#if loading}
        <div class="loading"><Loading /></div>
      {:else}
        <div class="overlayContext">
          <textarea bind:value={questions} />
          {#if questions === ""}
            <div class="overlay">{$t`questionsInTheBox`}</div>
          {/if}
        </div>
      {/if}
      <br />
      <label class="group column overlayContext">
        <input
          class="slider"
          type="range"
          bind:value={answerCount}
          min="1"
          max="10" />
        <div class="overlay">
          {`${$t`numberOfAnswers`} ${answerCount}`}
        </div>
      </label>
      <label class="group column overlayContext checkboxContext">
        <input type="checkbox" bind:checked={showQuestions} />
        <div class="checkbox" />
        <div class="overlay">
          {$t`showQuestions`}
        </div>
      </label>
      <label class="group column overlayContext checkboxContext">
        <input type="checkbox" bind:checked={collapsePrevious} />
        <div class="checkbox" />
        <div class="overlay">
          {$t`collapsePrevious`}
        </div>
      </label>
      <div />
    </div>
  </div>
  <div class="answers">
    {#if answerGroups.length > 0}
      {#each answerGroups as answerGroup (answerGroup.id)}
        <div animate:flip={{ duration: 300 }}>
          <Answer
            {answerGroup}
            {showQuestions}
            click={copy(answerGroup.question)}
            open={!collapsedAnswerGroupIds.includes(answerGroup.id)} />
        </div>
      {/each}
    {/if}
  </div>
</section>
{#if copied}
  {#key copied}
    <div
      class="copied"
      use:property={["top", copied.top]}
      use:property={["left", copied.left]}>
      {$t("copied")}
    </div>
  {/key}
{/if}

<style>
  :global(main) {
    background: linear-gradient(135deg, hsl(236, 9%, 98%), hsl(201, 33%, 90%))
      fixed;
    position: relative;
  }

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

  h1 {
    font-size: 5em;
    text-transform: uppercase;
    font-weight: 700;
    margin: 0 0 0.5em 0.5em;
    color: #00a2ff;
  }

  h1 span {
    display: inline-block;
  }

  section {
    flex-direction: row;
    margin: 0 0 0 3em;
  }

  .questions {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 30em;
  }

  .questions .sticky {
    position: sticky;
    top: 1em;
    display: flex;
    flex-direction: column;
  }

  .questions .loading {
    min-height: 20em;
    padding: 0.5em;
  }

  .questions textarea {
    resize: none;
    min-height: 20em;
    height: 100%;
    width: 100%;
    font-size: 1em;
    font-family: inherit;
    border-radius: 1em;
    border-width: 0.2em;
    border-color: transparent;
    padding: 0.5em;
  }

  .questions .overlayContext {
    position: relative;
  }

  .questions .overlay {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    place-content: center;
    pointer-events: none;
    display: flex;
    flex-direction: column;
  }

  .questions textarea + .overlay {
    text-align: center;
    font-size: 2em;
    font-weight: 800;
    color: rgb(0 0 0 / 15%);
  }

  .questions textarea:focus {
    border-color: #00a2ff;
    outline: none;
  }

  .checkboxContext {
    display: flex;
    flex-direction: row-reverse;
  }

  input[type="checkbox"] {
    display: none;
  }

  input[type="checkbox"] + .checkbox {
    height: 2em;
    width: 2em;
    background: hsl(201, 33%, 90%);
    border-radius: 0.2em;
  }

  input[type="checkbox"]:checked + .checkbox {
    background: #00a2ff;
  }

  input[type="range"] {
    appearance: none;
    background: hsl(201, 33%, 90%);
    border-radius: 0.2em;
    width: 100%;
    margin: 0;
    outline: none;
  }

  .questions input[type="range"] + .overlay {
    font-weight: 600;
    padding: 0 0 0 0.5em;
    color: #00a2ff;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    background: #00a2ff;
    height: 2em;
    width: 0.5em;
    border-radius: 5px;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    -webkit-appearance: none;
    background: #00a2ff;
    height: 2em;
    width: 0.5em;
    border-radius: 5px;
    cursor: pointer;
  }

  .copied {
    position: absolute;
    transform: translate(-50%, -50%);
    left: var(--left);
    top: var(--top);
    pointer-events: none;
    font-weight: 600;
    color: #00a2ff;
    font-variant: small-caps;
    animation: zoom 1.2s ease-out forwards;
    white-space: nowrap;
  }

  @keyframes zoom {
    0% {
      font-size: 2em;
      opacity: 1;
    }

    to {
      font-size: 4em;
      opacity: 0;
    }
  }

  .answers {
    flex: 2;
    padding: 0 0 5em 1em;
    color: #848484;
  }

  @media (max-width: 800px) {
    h1 {
      font-size: 3em;
    }
  }
</style>
