import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/lib/db";
import { getCurrentInternalUser } from "@/lib/session";
import Product from "@/models/Product";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_GROUP_KEYS = new Set(["color"]);

function buildLookup(id) {
  return isValidObjectId(id) ? { _id: id } : { slug: id };
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { apiKey, apiSecret, cloudName };
}

function signCloudinaryParams(params, apiSecret) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function getGroupParams(request) {
  const { searchParams } = new URL(request.url);
  const optionKey = String(searchParams.get("optionKey") || "").trim();
  const optionValue = String(searchParams.get("optionValue") || "").trim();
  const label = String(searchParams.get("label") || optionValue).trim();

  if (!ALLOWED_GROUP_KEYS.has(optionKey) || !optionValue) {
    throw new Error("Selecciona un color válido para esta galería.");
  }

  return { label, optionKey, optionValue };
}

function getProductMediaGroup(product, groupParams) {
  let group = product.mediaGroups?.find((mediaGroup) =>
    mediaGroup.optionKey === groupParams.optionKey &&
    mediaGroup.optionValue === groupParams.optionValue
  );

  if (!group) {
    product.mediaGroups.push({
      label: groupParams.label,
      media: [],
      optionKey: groupParams.optionKey,
      optionValue: groupParams.optionValue,
    });
    group = product.mediaGroups[product.mediaGroups.length - 1];
  }

  return group;
}

function getSortedMedia(group) {
  return [...(group.media || [])].sort((firstMedia, secondMedia) =>
    Number(secondMedia.isPrimary) - Number(firstMedia.isPrimary) ||
    Number(secondMedia.isSecondary) - Number(firstMedia.isSecondary) ||
    Number(secondMedia.isFeatured) - Number(firstMedia.isFeatured) ||
    (firstMedia.sortOrder || 0) - (secondMedia.sortOrder || 0)
  );
}

function serializeMedia(group) {
  return getSortedMedia(group).map((media) => ({
    alt: media.alt || "",
    bytes: media.bytes || null,
    format: media.format || "",
    height: media.height || null,
    isFeatured: Boolean(media.isFeatured),
    isPrimary: Boolean(media.isPrimary),
    isSecondary: Boolean(media.isSecondary),
    publicId: media.publicId || media.storageKey || "",
    secureUrl: media.secureUrl || media.url || "",
    sortOrder: media.sortOrder || 0,
    url: media.url || media.secureUrl || "",
    width: media.width || null,
  }));
}

async function requireInternalUser() {
  const user = await getCurrentInternalUser();

  if (!user) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  return null;
}

async function uploadToCloudinary(file, productId, groupParams, alt) {
  const config = getCloudinaryConfig();

  if (!config) {
    throw new Error("Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `kowac/products/${productId}/${groupParams.optionKey}/${groupParams.optionValue}`;
  const signedParams = { folder, timestamp };
  const signature = signCloudinaryParams(signedParams, config.apiSecret);
  const uploadForm = new FormData();
  const fileBuffer = await file.arrayBuffer();

  uploadForm.append("file", new Blob([fileBuffer], { type: file.type }), file.name || "kowac-product-color-image");
  uploadForm.append("api_key", config.apiKey);
  uploadForm.append("folder", folder);
  uploadForm.append("timestamp", String(timestamp));
  uploadForm.append("signature", signature);

  if (alt) {
    uploadForm.append("context", `alt=${alt.replace(/[|=]/g, " ").trim()}`);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: uploadForm,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || "Cloudinary no pudo subir la imagen.");
  }

  return result;
}

async function deleteFromCloudinary(publicId) {
  const config = getCloudinaryConfig();

  if (!config) {
    throw new Error("Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signedParams = { public_id: publicId, timestamp };
  const signature = signCloudinaryParams(signedParams, config.apiSecret);
  const deleteForm = new FormData();

  deleteForm.append("api_key", config.apiKey);
  deleteForm.append("public_id", publicId);
  deleteForm.append("timestamp", String(timestamp));
  deleteForm.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
    method: "POST",
    body: deleteForm,
  });
  const result = await response.json();

  if (!response.ok || result.result === "error") {
    throw new Error(result?.error?.message || "Cloudinary no pudo eliminar la imagen.");
  }
}

export async function POST(request, context) {
  try {
    const unauthorizedResponse = await requireInternalUser();

    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    await connectDB();

    const { id } = await context.params;
    const groupParams = getGroupParams(request);
    const product = await Product.findOne(buildLookup(id));

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const alt = String(formData.get("alt") || `${product.name} ${groupParams.label}` || "").trim();

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "Selecciona una imagen." }, { status: 400 });
    }

    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ message: "El archivo debe ser una imagen." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ message: "La imagen no puede superar 8 MB." }, { status: 400 });
    }

    const group = getProductMediaGroup(product, groupParams);
    const hasPrimary = group.media.some((media) => media.isPrimary);
    const upload = await uploadToCloudinary(file, product._id.toString(), groupParams, alt);
    const sortOrder = group.media.length
      ? Math.max(...group.media.map((media) => media.sortOrder || 0)) + 1
      : 0;

    group.media.push({
      alt,
      assetId: upload.asset_id || "",
      bytes: upload.bytes || null,
      format: upload.format || "",
      height: upload.height || null,
      isFeatured: false,
      isPrimary: !hasPrimary,
      isSecondary: false,
      provider: "cloudinary",
      publicId: upload.public_id || "",
      secureUrl: upload.secure_url || "",
      sortOrder,
      status: "ready",
      storageKey: upload.public_id || "",
      type: "image",
      url: upload.secure_url || upload.url || "",
      width: upload.width || null,
    });

    product.markModified("mediaGroups");
    await product.save();

    return NextResponse.json({ media: serializeMedia(group) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products/[id]/media error", error);
    return NextResponse.json(
      { message: error.message || "No se pudo subir la imagen." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const unauthorizedResponse = await requireInternalUser();

    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    await connectDB();

    const { id } = await context.params;
    const groupParams = getGroupParams(request);
    const body = await request.json();
    const publicId = String(body?.publicId || "").trim();
    const product = await Product.findOne(buildLookup(id));

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    const group = getProductMediaGroup(product, groupParams);
    const targetMedia = group.media.find((media) => (media.publicId || media.storageKey) === publicId);

    if (!targetMedia) {
      return NextResponse.json({ message: "Imagen no encontrada." }, { status: 404 });
    }

    if (Object.prototype.hasOwnProperty.call(body, "alt")) {
      targetMedia.alt = String(body.alt || "").trim();
    }

    if (body?.isPrimary) {
      group.media.forEach((media) => {
        const isTarget = (media.publicId || media.storageKey) === publicId;

        media.isPrimary = isTarget;
        if (isTarget) {
          media.isSecondary = false;
        }
      });
    }

    if (body?.isSecondary) {
      group.media.forEach((media) => {
        const isTarget = (media.publicId || media.storageKey) === publicId;

        media.isSecondary = isTarget;
        if (isTarget) {
          media.isPrimary = false;
        }
      });
    }

    if (Object.prototype.hasOwnProperty.call(body, "isFeatured")) {
      targetMedia.isFeatured = Boolean(body.isFeatured);
    }

    product.markModified("mediaGroups");
    await product.save();

    return NextResponse.json({ media: serializeMedia(group) }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/products/[id]/media error", error);
    return NextResponse.json(
      { message: error.message || "No se pudo actualizar la imagen." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const unauthorizedResponse = await requireInternalUser();

    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    await connectDB();

    const { id } = await context.params;
    const groupParams = getGroupParams(request);
    const body = await request.json();
    const publicId = String(body?.publicId || "").trim();
    const product = await Product.findOne(buildLookup(id));

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    const group = getProductMediaGroup(product, groupParams);
    const mediaIndex = group.media.findIndex((media) => (media.publicId || media.storageKey) === publicId);

    if (mediaIndex === -1) {
      return NextResponse.json({ message: "Imagen no encontrada." }, { status: 404 });
    }

    await deleteFromCloudinary(publicId);
    group.media.splice(mediaIndex, 1);

    if (group.media.length && !group.media.some((media) => media.isPrimary)) {
      group.media[0].isPrimary = true;
    }

    if (!group.media.some((media) => media.isSecondary)) {
      const secondaryCandidate = group.media.find((media) => !media.isPrimary) || null;

      if (secondaryCandidate) {
        secondaryCandidate.isSecondary = true;
      }
    }

    product.markModified("mediaGroups");
    await product.save();

    return NextResponse.json({ media: serializeMedia(group) }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/products/[id]/media error", error);
    return NextResponse.json(
      { message: error.message || "No se pudo eliminar la imagen." },
      { status: 500 }
    );
  }
}
