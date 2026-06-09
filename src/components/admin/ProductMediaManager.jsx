"use client";

import { BadgeCheck, ImagePlus, Images, Sparkles, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import AdminToast from "@/components/admin/AdminToast";

export default function ProductMediaManager({
  emptyDescription = "Sube la primera imagen para empezar a construir la galería de esta presentación.",
  endpoint,
  media = [],
  productName,
  sectionId = "imagenes",
  title = "Galería",
}) {
  const fileInputRef = useRef(null);
  const mediaEndpoint = endpoint;
  const [mediaItems, setMediaItems] = useState(media);
  const [alt, setAlt] = useState(productName || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [busyPublicId, setBusyPublicId] = useState("");
  const [toast, setToast] = useState(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setToast({
        message: "Selecciona una imagen antes de subir.",
        title: "Imagen requerida",
        type: "error",
      });
      return;
    }

    if (!mediaEndpoint) {
      setToast({
        message: "Esta galería no tiene un endpoint configurado.",
        title: "Galería no disponible",
        type: "error",
      });
      return;
    }

    setIsUploading(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("alt", alt);

      const response = await fetch(mediaEndpoint, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudo subir la imagen.");
      }

      setMediaItems(result.media || []);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setToast({
        message: "La imagen quedó guardada en Cloudinary.",
        title: "Imagen subida",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error.message || "Revisa la configuración de Cloudinary e intenta de nuevo.",
        title: "No se pudo subir",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function updateMedia(publicId, payload, successMessage) {
    setBusyPublicId(publicId);
    setToast(null);

    if (!mediaEndpoint) {
      setToast({
        message: "Esta galería no tiene un endpoint configurado.",
        title: "Galería no disponible",
        type: "error",
      });
      setBusyPublicId("");
      return;
    }

    try {
      const response = await fetch(mediaEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId,
          ...payload,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudo actualizar la imagen.");
      }

      setMediaItems(result.media || []);
      setToast({
        message: successMessage,
        title: "Imagen actualizada",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error.message || "Intenta nuevamente.",
        title: "No se pudo actualizar",
        type: "error",
      });
    } finally {
      setBusyPublicId("");
    }
  }

  async function deleteMedia(publicId) {
    setBusyPublicId(publicId);
    setToast(null);

    if (!mediaEndpoint) {
      setToast({
        message: "Esta galería no tiene un endpoint configurado.",
        title: "Galería no disponible",
        type: "error",
      });
      setBusyPublicId("");
      return;
    }

    try {
      const response = await fetch(mediaEndpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudo eliminar la imagen.");
      }

      setMediaItems(result.media || []);
      setToast({
        message: "La imagen fue eliminada de Cloudinary y del registro.",
        title: "Imagen eliminada",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error.message || "Intenta nuevamente.",
        title: "No se pudo eliminar",
        type: "error",
      });
    } finally {
      setBusyPublicId("");
    }
  }

  return (
    <section className="admin-product-media" id={sectionId} aria-label={title}>
      <div className="admin-product-media__header">
        <div>
          <span className="eyebrow">Galería</span>
          <h2>{title}</h2>
        </div>
        <span>{mediaItems.length} imagen(es)</span>
      </div>

      <form className="admin-product-media__uploader" onSubmit={handleUpload}>
        <label>
          <span>Archivo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
        <label>
          <span>Texto alternativo</span>
          <input
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder={productName}
          />
        </label>
        <button type="submit" disabled={isUploading}>
          <Upload size={16} strokeWidth={1.9} aria-hidden="true" />
          {isUploading ? "Subiendo..." : "Subir imagen"}
        </button>
      </form>

      {mediaItems.length ? (
        <div className="admin-product-media__grid">
          {mediaItems.map((item) => (
            <article key={item.publicId} className="admin-product-media__item">
              <div
                className="admin-product-media__preview"
                style={{ backgroundImage: `url(${item.secureUrl || item.url})` }}
              >
                <div className="admin-product-media__badges">
                  {item.isPrimary ? <span>Principal</span> : null}
                  {item.isSecondary ? <span>Secundaria</span> : null}
                  {item.isFeatured ? <span>Destacada</span> : null}
                </div>
              </div>
              <div className="admin-product-media__content">
                <strong>{item.alt || productName}</strong>
                <span>
                  {[item.width && item.height ? `${item.width}x${item.height}` : "", item.format?.toUpperCase()]
                    .filter(Boolean)
                    .join(" / ") || "Imagen Cloudinary"}
                </span>
              </div>
              <div className="admin-product-media__actions">
                <button
                  type="button"
                  disabled={item.isPrimary || busyPublicId === item.publicId}
                  onClick={() => updateMedia(item.publicId, { isPrimary: true }, "La imagen ahora es la principal.")}
                  aria-label={`Marcar ${item.alt || productName} como imagen principal`}
                  title="Marcar principal"
                >
                  <Star size={15} strokeWidth={1.9} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={item.isSecondary || busyPublicId === item.publicId}
                  onClick={() => updateMedia(item.publicId, { isSecondary: true }, "La imagen ahora es la secundaria.")}
                  aria-label={`Marcar ${item.alt || productName} como imagen secundaria`}
                  title="Marcar secundaria"
                >
                  <Images size={15} strokeWidth={1.9} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={busyPublicId === item.publicId}
                  onClick={() => updateMedia(
                    item.publicId,
                    { isFeatured: !item.isFeatured },
                    item.isFeatured ? "La imagen dejó de estar destacada." : "La imagen ahora está destacada."
                  )}
                  aria-label={`${item.isFeatured ? "Quitar destacada de" : "Marcar como destacada"} ${item.alt || productName}`}
                  title={item.isFeatured ? "Quitar destacada" : "Marcar destacada"}
                >
                  {item.isFeatured ? (
                    <BadgeCheck size={15} strokeWidth={1.9} aria-hidden="true" />
                  ) : (
                    <Sparkles size={15} strokeWidth={1.9} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={busyPublicId === item.publicId}
                  onClick={() => deleteMedia(item.publicId)}
                  aria-label={`Eliminar ${item.alt || productName}`}
                  title="Eliminar imagen"
                >
                  <Trash2 size={15} strokeWidth={1.9} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-product-media__empty">
          <ImagePlus size={22} strokeWidth={1.7} aria-hidden="true" />
          <strong>No hay imágenes todavía.</strong>
          <span>{emptyDescription}</span>
        </div>
      )}

      <AdminToast
        message={toast?.message}
        title={toast?.title}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </section>
  );
}
