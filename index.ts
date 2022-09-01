import { defineStore } from "pinia";

/** Store state to track, and map into a different form.  */
export type Poem = {
  title: string;
  verses: string[];
};

/** Mapped version of store state */
export type MappedPoem = {
  summary: string | null;
};

/** Cache of remote state (like react-query). */
export type DataLoader<Ok, Error = unknown> =
  // loading true or false, but has nothing yet
  | ({ loading: boolean } & {
      data: null;
      errors: null;
    })
  // retrieval failed - loading===false, has errors
  | {
      loading: false;
      data: null;
      errors: Error[];
    }
  // retrieval succeeded - loading===false, has data
  | {
      loading: false;
      data: Ok;
      errors: null;
    };

export function initDataLoader<T>(): DataLoader<T> {
  return { loading: false, data: null, errors: null };
}

export const usePoemStore = defineStore("poem", {
  state: () => initDataLoader<Poem>(),
});

export function createSummary(poem: Poem) {
  const { title, verses } = poem;
  const firstVerse = verses?.[0] || "{missing}";
  return `Title: ${title} First verse: ${firstVerse}`;
}
