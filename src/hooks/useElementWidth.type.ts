import type { RefObject } from "react";

export type ElementWidth<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  width: number;
};
