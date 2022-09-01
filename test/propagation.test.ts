import { createPinia, defineStore, Pinia, Store, storeToRefs } from "pinia";
import { describe, test, expect } from "vitest";
import { computed, reactive, watch } from "vue";

import {
  Poem,
  DataLoader,
  usePoemStore,
  createSummary,
  MappedPoem,
} from "../index";

const examplePoem: Poem = {
  title: "Roud Folk Song Index number 19798",
  verses: [
    "Roses are red",
    "Violets are blue,",
    "Sugar is sweet",
    "And so are you.",
  ],
};

/**
 * Unhappy paths: various non-functioning attempts to make a simplifed reactive
 * data structure that tracks a more complex Pinia store state.
 */

function emulateLoading(poemStore: Store<any, DataLoader<Poem>>, poem: Poem) {
  // pretend to start loading - no data yet
  poemStore.$patch({
    loading: true,
    data: null,
    errors: null,
  });
  // pretend to finish loading - data has arrived
  poemStore.$patch({
    loading: false,
    data: poem,
    errors: null,
  });
  // check that state has changed
  expect(poemStore.$state).toMatchObject({
    loading: false,
    data: poem,
    errors: null,
  });
}

/** Example store with setup() wiring up a ComputedRef<string> */
const useComputedStore = defineStore("store-without-refs", () => {
  const poemStore = usePoemStore();

  const summary = computed(() => {
    const { data } = poemStore;
    if (data) {
      return createSummary(data);
    }
    return null;
  });

  return {
    summary,
  };
});

/** Example store with setup() first mapping from store to refs,
 * then using the ref to create a ComputedRef<string>
 */
const useStoreToRefs = defineStore("store-with-refs", () => {
  const poemStore = usePoemStore();

  const { data } = storeToRefs(poemStore);
  const summary = computed(() => {
    if (data?.value) {
      const { title, verses } = data.value;
      const firstVerse = verses?.[0] || "{missing}";
      return `Title: ${title} First verse: ${firstVerse}`;
    }
    return null;
  });

  return {
    summary,
  };
});

/** Example vue reactive object, with a watch of a pinia store
 * triggering explicit writes to it.
 */
function createReactiveWithWatch(pinia: Pinia) {
  const poemStore = usePoemStore(pinia);

  const mappedPoem = reactive<MappedPoem>({
    summary: null,
  });

  watch(
    () => poemStore.loading,
    () => {
      const { data } = poemStore;
      if (data) {
        mappedPoem.summary = createSummary(data);
      }
      mappedPoem.summary = null;
    }
  );

  return mappedPoem;
}

/** Create a reactive object, and $subscribe to pinia state changes
 * that trigger explicit writes.
 */
function createReactiveWithSubscribe(pinia: Pinia) {
  const poemStore = usePoemStore(pinia);

  const mappedPoem = reactive<MappedPoem>({
    summary: null,
  });

  poemStore.$subscribe(() => {
    const { data } = poemStore;
    if (data) {
      mappedPoem.summary = createSummary(data);
    }
    mappedPoem.summary = null;
  });

  return mappedPoem;
}

describe("Unhappy paths recording failed propagation - tests shouldn't pass, but they do!", () => {
  test("Computed Store", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const summaryStore = useComputedStore(pinia);
    emulateLoading(poemStore, examplePoem);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(summaryStore.$state).toMatchInlineSnapshot("{}");
  });

  test("Computed Store with storeToRefs", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const summaryStore = useStoreToRefs(pinia);
    emulateLoading(poemStore, examplePoem);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(summaryStore.$state).toMatchInlineSnapshot("{}");
  });

  test("Reactive with watch", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const mapped = createReactiveWithWatch(pinia);
    emulateLoading(poemStore, examplePoem);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mapped).toMatchInlineSnapshot(`
      {
        "summary": null,
      }
    `);
  });

  test("Reactive with subscribe", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const mapped = createReactiveWithSubscribe(pinia);
    emulateLoading(poemStore, examplePoem);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mapped).toMatchInlineSnapshot(`
      {
        "summary": null,
      }
    `);
  });
});

describe("Mapping the state", () => {
  test("createSummary()", () => {
    expect(createSummary(examplePoem)).toBe(
      "Title: Roud Folk Song Index number 19798 First verse: Roses are red"
    );
  });
});
