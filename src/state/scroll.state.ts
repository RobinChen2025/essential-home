import { observable } from "@legendapp/state";

export const scrollState$ = observable<{section: number | null}>({
  section: null,
});