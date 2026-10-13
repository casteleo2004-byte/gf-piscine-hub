// Foto e screenshot salvati sul dispositivo (IndexedDB), ridimensionati per
// occupare poco spazio. Restano disponibili offline.

const DB_NAME = "wrc-hub-photos";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Ridimensiona a max 1600px (JPEG) e salva. Restituisce l'id. */
export async function savePhoto(file: File): Promise<string> {
  const blob = await downscale(file, 1600, 0.82);
  const id = `ph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  await tx("readwrite", (s) => s.put(blob, id));
  return id;
}

export function getPhoto(id: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
}

export async function deletePhoto(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export function countPhotos(): Promise<number> {
  return tx("readonly", (s) => s.count());
}

async function downscale(file: File, max: number, quality: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality),
    );
  } catch {
    return file;
  }
}
