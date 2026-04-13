import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

const mockWriteBinary = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/commands", () => ({
  writeBinary: (...args: unknown[]) => mockWriteBinary(...args),
}));

import { handleImagePaste } from "@/lib/imagePaste";

function fakeEvent(mimeType?: string): ClipboardEvent {
  const items = mimeType
    ? [
        {
          type: mimeType,
          getAsFile: () => new File(["x"], `img.${mimeType.split("/")[1]}`, { type: mimeType }),
        },
      ]
    : [];
  return { clipboardData: { items } } as unknown as ClipboardEvent;
}

describe("imagePaste - handleImagePaste", () => {
  beforeEach(() => {
    mockWriteBinary.mockClear();
  });

  it("returns null when no items in clipboard", async () => {
    expect(await handleImagePaste(fakeEvent(), "/root")).toBeNull();
  });

  it("returns null when clipboard has non-image item", async () => {
    expect(await handleImagePaste(fakeEvent("text/plain"), "/root")).toBeNull();
  });

  it("calls writeBinary and returns relative path for PNG", async () => {
    const result = await handleImagePaste(fakeEvent("image/png"), "/root");
    expect(mockWriteBinary).toHaveBeenCalledOnce();
    expect(result).toMatch(/^assets\/image-\d+\.png$/);
  });

  it("uses .jpg extension for image/jpeg", async () => {
    expect(await handleImagePaste(fakeEvent("image/jpeg"), "/root")).toMatch(/\.jpg$/);
  });

  it("uses .webp extension for image/webp", async () => {
    expect(await handleImagePaste(fakeEvent("image/webp"), "/root")).toMatch(/\.webp$/);
  });

  it("returns null when rootDir is null", async () => {
    const result = await handleImagePaste(fakeEvent("image/png"), null);
    expect(result).toBeNull();
    expect(mockWriteBinary).not.toHaveBeenCalled();
  });

  it("writes to rootDir/assets/", async () => {
    await handleImagePaste(fakeEvent("image/png"), "/my/notes");
    const [path] = mockWriteBinary.mock.calls[0] as [string, ...unknown[]];
    expect(path).toContain("/my/notes/assets/");
  });
});
