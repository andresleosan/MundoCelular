import { useState } from "react";
import { prepararImagenes } from "@/lib/image-compress";
import { useAuth } from "./useAuth";

interface UploadedImage {
  url: string;
  thumb: string;
  alt: string;
}

export function useImageUpload() {
  const { usuario } = useAuth();
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);

  async function subirImagen(file: File, alt?: string): Promise<UploadedImage> {
    if (!usuario) throw new Error("No autenticado");
    setSubiendo(true);
    setProgreso(0);

    try {
      const token = await usuario.getIdToken();
      const { full, thumb } = await prepararImagenes(file);
      setProgreso(30);

      const resFull = await fetch("/api/imagenes/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: `${file.name}-full`, contentType: "image/webp", size: full.blob.size }),
      });
      const fullData = await resFull.json();
      if (!resFull.ok) throw new Error(fullData.error || "Error al generar URL de subida");

      await fetch(fullData.url, { method: "PUT", body: full.blob, headers: { "Content-Type": "image/webp" } });
      setProgreso(60);

      const resThumb = await fetch("/api/imagenes/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: `${file.name}-thumb`, contentType: "image/webp", size: thumb.blob.size }),
      });
      const thumbData = await resThumb.json();
      if (!resThumb.ok) throw new Error(thumbData.error || "Error al generar URL de subida thumb");

      await fetch(thumbData.url, { method: "PUT", body: thumb.blob, headers: { "Content-Type": "image/webp" } });
      setProgreso(100);

      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
      const fullUrlPublic = `${publicBase}/${fullData.key}`;
      const thumbUrlPublic = `${publicBase}/${thumbData.key}`;

      return { url: fullUrlPublic, thumb: thumbUrlPublic, alt: alt || file.name };
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  }

  async function eliminarImagen(key: string): Promise<void> {
    if (!usuario) throw new Error("No autenticado");
    const token = await usuario.getIdToken();
    await fetch(`/api/imagenes/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  return { subirImagen, eliminarImagen, subiendo, progreso };
}
