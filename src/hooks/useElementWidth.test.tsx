import { act, render, screen } from "@/libs/unit-test";

import { useElementWidth } from "@/hooks/useElementWidth";

type ObserverCallback = (records: { contentRect: { width: number } }[]) => void;

/**
 * Probe component printing the measured width.
 * @returns {React.ReactElement} - Probe
 */
const Probe = (): React.ReactElement => {
  const { ref, width } = useElementWidth<HTMLDivElement>();

  return <div ref={ref}>{width}</div>;
};

describe("useElementWidth", () => {
  it("should report the observed width and disconnect on unmount", () => {
    let callback: ObserverCallback = () => undefined;
    const disconnect = jest.fn();

    (globalThis.ResizeObserver as jest.Mock).mockImplementation((cb: ObserverCallback) => {
      callback = cb;

      return { observe: jest.fn(), unobserve: jest.fn(), disconnect };
    });

    const { unmount } = render(<Probe />);

    expect(screen.getByText("0")).toBeInTheDocument();

    act(() => callback([{ contentRect: { width: 640 } }]));
    expect(screen.getByText("640")).toBeInTheDocument();

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
