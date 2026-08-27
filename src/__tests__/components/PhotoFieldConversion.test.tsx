import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoField from "@/components/contacts/PhotoField";
import { downscaleToDataUrl } from "@/lib/contacts/photo";

/**
 * Conversion is asynchronous, so these cover what happens *while* it is running:
 * the form must not save the stale hidden value, and a slow result must not land
 * on top of a newer choice.
 */
jest.mock("@/lib/contacts/photo", () => ({
  ...jest.requireActual("@/lib/contacts/photo"),
  downscaleToDataUrl: jest.fn(),
}));

const downscale = downscaleToDataUrl as jest.MockedFunction<
  typeof downscaleToDataUrl
>;

/** A promise this test resolves by hand, so conversion can be held mid-flight. */
function deferred() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function pngFile(name: string) {
  return new File(["binary"], name, { type: "image/png" });
}

/** A file the picker refuses: an accepted type, but past `MAX_SOURCE_BYTES`. */
function hugePngFile(name: string) {
  const file = pngFile(name);
  Object.defineProperty(file, "size", { value: 26 * 1024 * 1024 });
  return file;
}

function photoValue(container: HTMLElement): string | null {
  return container
    .querySelector<HTMLInputElement>('input[name="photo"]')!
    .getAttribute("value");
}

beforeEach(() => downscale.mockReset());

describe("PhotoField while a photo is converting", () => {
  it("reports busy so the form can hold Save until the photo is ready", async () => {
    const first = deferred();
    downscale.mockReturnValueOnce(first.promise);
    const onBusyChange = jest.fn();

    render(<PhotoField onBusyChange={onBusyChange} />);
    await userEvent.upload(screen.getByLabelText(/upload photo/i), pngFile("a.png"));

    await waitFor(() => expect(onBusyChange).toHaveBeenCalledWith(true));
    expect(screen.getByRole("status")).toHaveTextContent(/preparing photo/i);

    first.resolve("data:image/jpeg;base64,AAAA");
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
  });

  it("keeps the newer selection when an older conversion finishes last", async () => {
    const slow = deferred();
    const fast = deferred();
    downscale.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);

    const { container } = render(<PhotoField />);
    const input = screen.getByLabelText(/upload photo/i);

    await userEvent.upload(input, pngFile("old.png"));
    await userEvent.upload(input, pngFile("new.png"));

    fast.resolve("data:image/jpeg;base64,NEW=");
    await waitFor(() =>
      expect(photoValue(container)).toBe("data:image/jpeg;base64,NEW="),
    );

    // The superseded conversion lands afterwards and must be ignored.
    slow.resolve("data:image/jpeg;base64,OLD=");
    await waitFor(() =>
      expect(photoValue(container)).toBe("data:image/jpeg;base64,NEW="),
    );
  });

  it("does not restore a photo the user removed mid-conversion", async () => {
    const pending = deferred();
    downscale.mockReturnValueOnce(pending.promise);

    const { container } = render(<PhotoField defaultValue="data:image/jpeg;base64,OLD=" />);
    await userEvent.upload(screen.getByLabelText(/change photo/i), pngFile("a.png"));
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    pending.resolve("data:image/jpeg;base64,LATE=");

    await waitFor(() => expect(photoValue(container)).toBe(""));
  });

  it("ends the busy state when the next pick is rejected", async () => {
    const pending = deferred();
    downscale.mockReturnValueOnce(pending.promise);
    const onBusyChange = jest.fn();

    render(<PhotoField onBusyChange={onBusyChange} />);
    const input = screen.getByLabelText(/upload photo/i);

    await userEvent.upload(input, pngFile("good.png"));
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(true));

    // A refused file still supersedes the conversion in flight, so that
    // conversion will not clear the busy state on its way out — if the refusal
    // does not clear it either, Save stays disabled for good.
    await userEvent.upload(input, hugePngFile("huge.png"));

    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    expect(screen.getByRole("alert")).toHaveTextContent(/over 25 MB/i);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("reports a conversion failure against the field", async () => {
    downscale.mockRejectedValueOnce(new Error("decode failed"));

    render(<PhotoField />);
    await userEvent.upload(screen.getByLabelText(/upload photo/i), pngFile("a.png"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/could not be read/i),
    );
  });
});
