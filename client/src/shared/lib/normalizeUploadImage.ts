const HEIC_RE = /heic|heif/i;

const isHeic = (file: File): boolean =>
  HEIC_RE.test(file.type) || HEIC_RE.test(file.name);

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = src;
  });

/**
 * iPhone отдаёт фото в HEIC, который сервер (Jimp) не умеет читать. Safari
 * (в т.ч. на iOS) умеет декодировать HEIC в <img>, поэтому конвертируем в JPEG
 * прямо в браузере через canvas. На браузерах без поддержки HEIC <img> не
 * загрузится — тогда просто возвращаем исходный файл (там этой проблемы нет).
 */
export const normalizeUploadImage = async (file: File): Promise<File> => {
  if (!isHeic(file)) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    );
    if (!blob) return file;

    const name = file.name.replace(/\.(heic|heif)$/i, '.jpg') || 'photo.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
};
