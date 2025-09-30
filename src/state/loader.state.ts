import { observable } from "@legendapp/state";

export const loaderState$ = observable({
  isFinished: false,
})