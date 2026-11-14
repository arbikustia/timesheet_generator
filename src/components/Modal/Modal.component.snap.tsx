import { render } from "@/libs/unit-test";

import { ModalComponent } from "./Modal.component";

describe("ModalComponent snapshots", () => {
  it("should match open modal snapshot", (): void => {
    const { baseElement } = render(
      <ModalComponent isOpen={true} onClose={jest.fn()} title="Modal title">
        <p>Modal content</p>
      </ModalComponent>,
    );

    // The modal renders through a portal into document.body.
    expect(baseElement).toMatchSnapshot();
  });
});
