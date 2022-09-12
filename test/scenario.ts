import { Store } from "pinia";
import type { DataLoader, Poem } from "..";

export const FIXTURE_POEM: Poem = {
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
export function emulateLoading(
  poemStore: Store<any, DataLoader<Poem>>,
  poem: Poem
) {
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
}
