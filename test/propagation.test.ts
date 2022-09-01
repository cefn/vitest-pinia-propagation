import { createPinia, defineStore, Pinia, Store, storeToRefs } from "pinia";
import { describe, test, expect } from "vitest";
import { computed, reactive, watch } from "vue";

/**
 * Unhappy paths: various non-functioning attempts to make a simplifed reactive
 * data structure that tracks a more complex Pinia store state.
 */

/** Store state to track, and map into a different form.  */
type Poem = {
  title: string;
  verses: string[];
};

/** Mapped version of store state */
type MappedPoem = {
  summary: string | null;
};

/** Cache of remote state (like react-query). */
export type DataLoader<Ok, Error = unknown> =
  // loading true or false, but has nothing yet
  | ({ loading: boolean } & {
      data?: never;
      errors?: never;
    })
  // retrieval failed - loading===false, has errors
  | {
      loading: false;
      data?: never;
      errors: Error[];
    }
  // retrieval succeeded - loading===false, has data
  | {
      loading: false;
      data: Ok;
      errors?: never;
    };

function createSummary(poem: Poem) {
  const { title, verses } = poem;
  const firstVerse = verses?.[0] || "{missing}";
  return `Title: ${title} First verse: ${firstVerse}`;
}

function createDataLoader<T>(): DataLoader<T> {
  return { loading: false, data: undefined, errors: undefined };
}

const usePoemStore = defineStore("poem", {
  state: () => createDataLoader<Poem>(),
});

const examplePoem: Poem = {
  title: "Roud Folk Song Index number 19798",
  verses: [
    "Roses are red",
    "Violets are blue,",
    "Sugar is sweet",
    "And so are you.",
  ],
};

function populateLoader(poemStore: Store<any, DataLoader<Poem>>, poem: Poem) {
  // pretend to start loading
  poemStore.$patch({
    loading: true,
  });
  // pretend to finish loading
  poemStore.$patch({
    loading: false,
    data: poem,
  });
  // check that state has changed
  expect(poemStore.$state).toMatchObject({
    loading: false,
    data: poem,
  });
}

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

describe("Mapping the state", () => {
  test("createSummary()", () => {
    expect(createSummary(examplePoem)).toBe(
      "Title: Roud Folk Song Index number 19798 First verse: Roses are red"
    );
  });
});

describe("Reactivity pattern - unhappy paths", () => {
  test("Computed Store", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const summaryStore = useComputedStore(pinia);
    populateLoader(poemStore, examplePoem);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(summaryStore.$state).toMatchInlineSnapshot("{}");
  });

  test("Computed Store with storeToRefs", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const summaryStore = useStoreToRefs(pinia);
    populateLoader(poemStore, examplePoem);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(summaryStore.$state).toMatchInlineSnapshot("{}");
  });

  test("Reactive with watch", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const mapped = createReactiveWithWatch(pinia);
    populateLoader(poemStore, examplePoem);
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
    populateLoader(poemStore, examplePoem);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mapped).toMatchInlineSnapshot(`
      {
        "summary": null,
      }
    `);
  });
});
