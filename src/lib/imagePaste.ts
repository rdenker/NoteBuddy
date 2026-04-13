import { writeBinary } from "@/lib/commands";

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return map[mimeType] ?? "png";
}

async function saveImage(file: File, rootDir: string | null): Promise<string | null> {
  if (!rootDir) return null;
  const ext = getExtension(file.type);
  const name = `image-${Date.now()}.${ext}`;
  const assetsDir = `${rootDir}/assets`;
  const fullPath = `${assetsDir}/${name}`;

  const buf = await file.arrayBuffer();
  const data = Array.from(new Uint8Array(buf));
  await writeBinary(fullPath, data);
  return `assets/${name}`;
}

export async function handleImageDrop(file: File, rootDir: string | null): Promise<string | null> {
  return saveImage(file, rootDir);
}

export async function handleImagePaste(
  e: ClipboardEvent,
  rootDir: string | null
): Promise<string | null> {
  const items = Array.from(e.clipboardData?.items ?? []);
  const imageItem = items.find((i) => i.type.startsWith("image/"));
  if (!imageItem) return null;

  const file = imageItem.getAsFile();
  if (!file) return null;

  return saveImage(file, rootDir);
}
