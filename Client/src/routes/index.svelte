<script lang="ts">
  import { stores } from "@sapper/app";
  import { translate } from "../utilities/translateStore";
  import { debounce, throttle } from "lodash";
  import wretch from "wretch";
  import { fly } from "svelte/transition";
  import Loading from "../shared/loading.svelte";
  import type { ISession } from "../shared/session";
  import type { IQnASearchResultList } from "../shared/qnaMaker";
  import { onMount } from "svelte";

  interface IAnswerGroup {
    question: string;
    answers: IAnswer[];
    id: number;
  }

  interface IAnswer {
    answer: string;
    questions: string[];
    score: number;
    id: number;
  }

  const { session } = stores<ISession>();

  let ready = false;
  onMount(() => (ready = true));

  let answerGroups: IAnswerGroup[] = [];
  let trainingPairs: Map<
    number,
    { question: string; answer: IAnswer }
  > = new Map<number, { question: string; answer: IAnswer }>();

  let questions: string = "";
  let loading: boolean;

  const sendingInStart = 5000;

  let sendingIn: number = sendingInStart;
  let sendingIntervalId: number;

  const sendingInterval = () => (sendingIn -= 1000);

  const resetSendingInterval = () => {
    clearInterval(sendingIntervalId);
    sendingIn = sendingInStart;
  };

  $: {
    resetSendingInterval();

    if (questions !== "") {
      sendingIntervalId = setInterval(sendingInterval, 1000);
      debounceQuestions(questions);
    }
  }

  const debounceQuestions = debounce(
    (oldQuestions: string) =>
      questions === oldQuestions && loadData(oldQuestions),
    sendingInStart
  );

  const loadData = async (newQuestions: string) => {
    questions = "";
    loading = true;

    for (const question of newQuestions
      .split(/\r?\n/)
      .filter((line) => line !== "")
      .reverse()) {
      const response = await wretch($session.qnaMaker.endpoint)
        .auth($session.qnaMaker.auth)
        .post({
          question,
          rankerType: "QuestionOnly",
          top: 3,
        })
        .json<IQnASearchResultList>();

      const maxScore = response.answers[0].score;

      answerGroups = [
        {
          question,
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

  let copied: HTMLDivElement;
  let copiedTimeoutId: number;

  const copy = (question: string, answer: IAnswer) => (
    event: MouseEvent & {
      currentTarget: HTMLDivElement;
    }
  ) => {
    copied.classList.remove("animate");

    const temporaryElement = document.createElement("p");

    temporaryElement.contentEditable = "true";
    temporaryElement.textContent = event.currentTarget.textContent;

    event.currentTarget.parentElement.appendChild(temporaryElement);
    temporaryElement.focus();
    document.execCommand("selectAll");
    document.execCommand("copy");
    event.currentTarget.parentElement.removeChild(temporaryElement);

    if (copiedTimeoutId !== undefined) {
      clearTimeout(copiedTimeoutId);
    }

    copied.classList.add("animate");
    copied.style.setProperty("--x", `${event.clientX}px`);
    copied.style.setProperty("--y", `${event.clientY}px`);

    copiedTimeoutId = setTimeout(() => {
      copied.classList.remove("animate");
      copiedTimeoutId = undefined;
    }, 1500);

    trainingPairs.set(answer.id, { question, answer });
    trainThrottle();
  };

  const opacity = (node: HTMLElement, score: number) => {
    node.style.setProperty("--opacity", `${score}`);
  };

  const trainThrottle = throttle(
    async () => {
      await wretch($session.qnaMaker.trainEndpoint)
        .auth($session.qnaMaker.auth)
        .post({
          feedbackRecords: [...trainingPairs.values()].map((trainingPair) => ({
            userQuestion: trainingPair.question,
            qnaId: trainingPair.answer.id,
          })),
        });
    },
    10000,
    { leading: false }
  );

  const t = translate($session.translations);
</script>

<svelte:head>
  <title>{$session.title}</title>
</svelte:head>

{#if ready}
  <h1 in:fly={{ x: 100 }}>{$session.title}</h1>
{:else}
  <h1>&nbsp;</h1>
{/if}
<section>
  <div class="questions">
    <div class="sticky">
      <p>{$t("questionsInTheBox")}</p>
      {#if loading}
        <div class="loading"><Loading /></div>
      {:else}
        <textarea bind:value={questions} />
      {/if}
      <div>
        <button
          disabled={questions === ""}
          on:click={() => loadData(questions)}>
          {#if questions === "" || sendingIn > 3000}
            {$t("ask")}
          {:else}
            {`${$t("askingIn")} ${sendingIn / 1000} ${$t("askingInSeconds")}`}
          {/if}
        </button>
      </div>
    </div>
  </div>
  <div class="answers">
    {#if answerGroups.length > 0}
      <p>{$t("clickToCopy")}</p>
      {#each answerGroups as answerGroup (answerGroup.id)}
        <div class="answerGroup" transition:fly={{ x: 50 }}>
          <div class="question">{answerGroup.question}</div>
          {#each answerGroup.answers as answer}
            <div>
              <div
                class="answer"
                title={answer.questions.join("\n")}
                use:opacity={answer.score}
                on:click={copy(answerGroup.question, answer)}>
                {answer.answer}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
</section>
<div class="copied" bind:this={copied}>
  {$t("copied")}
</div>

<style>
  h1 {
    font-size: 5em;
    text-transform: uppercase;
    font-weight: 700;
    margin: 0 0 0.5em 0.5em;
  }

  section {
    flex-direction: row;
  }

  .copied {
    position: fixed;
    pointer-events: none;
    display: none;
    transform: translate(-50%, -50%);
    font-weight: 600;
    color: #00a2ff;
    font-variant: small-caps;
    left: var(--x);
    top: var(--y);
  }

  :global(.copied.animate) {
    display: block !important;
    animation: zoom 1.2s ease-out forwards;
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

  .questions {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .questions .sticky {
    position: sticky;
    top: 0;
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
    font-size: 1em;
    font-family: inherit;
    border-radius: 1em;
    border-width: 0.2em;
    padding: 0.5em;
  }

  .questions textarea:focus {
    border-color: #00a2ff;
    outline: none;
  }

  .questions button {
    margin-top: 1em;
    background: #00a2ff;
    border: none;
    color: white;
    padding: 0.5em 1em;
    font-weight: 600;
    font-size: 1.25em;
    border-radius: 0.5em;
  }

  .questions button:disabled {
    background: #577383;
    color: rgb(194, 194, 194);
  }

  .questions button:hover {
    background: #0cb2ff;
    cursor: help;
  }

  .questions button:disabled:hover {
    background: #577383;
    cursor: not-allowed;
  }

  .questions button:focus:not(:disabled) {
    outline: none;
  }

  .answers {
    flex: 2;
    padding: 0 0 0 1em;
  }

  .answers .answerGroup {
    margin: 0.5em 0;
  }

  .answers .question {
    font-weight: 500;
    color: #848484;
    font-size: 0.8em;
  }

  .answers .answer {
    margin: 0.1em 0 0.1em 1em;
    background: #e8e8e8;
    border-radius: 0.5em;
    padding: 0.5em;
    display: inline-block;
    transition: 0.3s ease;
    opacity: var(--opacity);
  }

  .answers .answer:hover {
    background: #6cd6ff;
    opacity: 1;
    cursor: copy;
  }

  @media (max-width: 800px) {
    h1 {
      font-size: 3em;
    }
  }
</style>
