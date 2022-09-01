import { Pinia, createPinia } from "pinia";

import { describe, test, expect } from "vitest";
import { reactive, watch } from "vue";

import { createSummary, MappedPoem, usePoemStore } from "..";
import { emulateLoading, FIXTURE_POEM } from "./scenario";

/** Make a vue reactive object, watch() a pinia store and trigger explicit
 * writes.
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

/** Make a vue reactive object, $subscribe() a pinia store and trigger explicit
 * writes.
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

describe("Failure - tests pass but shouldn't - summary==='null' shows emulateLoading(...) doesn't propagate", () => {
  test("Reactive with watch", async () => {
    const pinia = createPinia();
    const poemStore = usePoemStore(pinia);
    const mapped = createReactiveWithWatch(pinia);
    emulateLoading(poemStore, FIXTURE_POEM);
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
    emulateLoading(poemStore, FIXTURE_POEM);
    expect(mapped).toMatchInlineSnapshot(`
      {
        "summary": null,
      }
    `);
  });
});
