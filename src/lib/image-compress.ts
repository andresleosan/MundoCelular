interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resizeCanvas(img: HTMLImageElement, maxWidth: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ratio = Math.min(maxWidth / img.naturalWidth, 1);
  canvas.width = img.naturalWidth * ratio;
  canvas.height = img.naturalHeight * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function comprimirImagen(
  file: File,
  maxWidth: number,
  quality = 0.85
): Promise<CompressedImage> {
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  const canvas = resizeCanvas(img, maxWidth);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve({ blob: blob!, width: canvas.width, height: canvas.height }),
      "image/webp",
      quality
    );
  });
}

export async function prepararImagenes(
  file: File
): Promise<{ full: CompressedImage; thumb: CompressedImage }> {
  const full = await comprimirImagen(file, 1600);
  const thumb = await comprimirImagen(file, 600);
  return { full, thumb };
}
