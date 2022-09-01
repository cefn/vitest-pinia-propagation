import { computed } from "vue";
import { createPinia, defineStore, storeToRefs } from "pinia";

import { describe, test, expect } from "vitest";

import { createSummary, usePoemStore } from "..";
import { emulateLoading, FIXTURE_POEM } from "./scenario";

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

describe("Success: These tests pass correctly", () => {
  test("Computed Store", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const summaryStore = useComputedStore(pinia);
    emulateLoading(poemStore, FIXTURE_POEM);
    expect(summaryStore).toMatchObject({
      summary:
        "Title: Roud Folk Song Index number 19798 First verse: Roses are red",
    });
  });

  test("Computed Store with storeToRefs", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const summaryStore = useStoreToRefs(pinia);
    emulateLoading(poemStore, FIXTURE_POEM);
    expect(summaryStore).toMatchObject({
      summary:
        "Title: Roud Folk Song Index number 19798 First verse: Roses are red",
    });
  });
});
