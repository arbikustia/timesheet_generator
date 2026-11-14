import { useEffect, useRef, useState } from "react";

import type { ElementWidth } from "./useElementWidth.type";

/**
 * Track the content width of an element with ResizeObserver.
 * @returns {ElementWidth<T>} - Ref to attach and the current width in CSS px (0 before the first measure)
 */
export const useElementWidth = <T extends HTMLElement>(): ElementWidth<T> => {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    setWidth(element.clientWidth);

    const observer = new ResizeObserver((records) => {
      setWidth(records[0]?.contentRect.width ?? element.clientWidth);
    });

    observer.observe(element);

    return (): void => observer.disconnect();
  }, []);

  return { ref, width };
};
