export type Receipt = {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
};

function key(itemId: string) {
  return `nuv_receipts_${itemId}`;
}

export function loadReceipts(itemId: string): Receipt[] {
  try {
    return JSON.parse(localStorage.getItem(key(itemId)) || "null") ?? [];
  } catch {
    return [];
  }
}

export function saveReceipts(itemId: string, receipts: Receipt[]): void {
  try {
    localStorage.setItem(key(itemId), JSON.stringify(receipts));
  } catch {
    // storage full
  }
}

export function deleteAllReceipts(itemId: string): void {
  localStorage.removeItem(key(itemId));
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1400;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function fileToReceipt(file: File): Promise<Receipt> {
  const isImage = file.type.startsWith("image/");
  let dataUrl: string;
  if (isImage) {
    dataUrl = await compressImage(file);
  } else {
    dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  return { id: crypto.randomUUID(), name: file.name, type: isImage ? "image/jpeg" : file.type, dataUrl };
}
