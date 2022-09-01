import { computed, reactive, watch } from "vue";
import { createPinia, defineStore, Pinia } from "pinia";

import { describe, test, expect } from "vitest";

import { summarisePoemLoader, MappedPoem, usePoemStore } from "..";
import { emulateLoading, FIXTURE_POEM } from "./scenario";

/** Example store with setup() wiring up a ComputedRef<string> */
const useComputedStore = defineStore("summary", () => {
  const poemStore = usePoemStore();
  const summary = computed(() => summarisePoemLoader(poemStore));
  return {
    summary,
  };
});

/** Make a vue reactive object, watch() a pinia store and trigger explicit
 * writes.
 */
function createReactiveWithWatch(pinia: Pinia) {
  const poemStore = usePoemStore(pinia);
  const mappedPoem = reactive<MappedPoem>({
    summary: null,
  });
  watch(
    () => poemStore.data,
    () => {
      mappedPoem.summary = summarisePoemLoader(poemStore);
    },
    { immediate: true }
  );
  return mappedPoem;
}

/** Make a vue reactive object, $subscribe() a pinia store and trigger explicit
 * writes.
 */
function createReactiveWithSubscribe(pinia: Pinia) {
  const poemStore = usePoemStore(pinia);

  const mappedPoem = reactive<MappedPoem>({
    summary: null,
  });
  poemStore.$subscribe(() => {
    mappedPoem.summary = summarisePoemLoader(poemStore);
  });
  return mappedPoem;
}

describe("Compose reactive state backed by a store in various ways", () => {
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

  test("Reactive with watch", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const mapped = createReactiveWithWatch(pinia);
    emulateLoading(poemStore, FIXTURE_POEM);
    await Promise.resolve();
    expect(mapped).toMatchObject({
      summary:
        "Title: Roud Folk Song Index number 19798 First verse: Roses are red",
    });
  });

  test("Reactive with subscribe", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const mapped = createReactiveWithSubscribe(pinia);
    emulateLoading(poemStore, FIXTURE_POEM);
    await Promise.resolve();
    expect(mapped).toMatchObject({
      summary:
        "Title: Roud Folk Song Index number 19798 First verse: Roses are red",
    });
  });
});
