"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import styles from "./ProductCard.module.scss";

export default function FavoriteButton({ productId, productName }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isDisabled = !productId || isPending;

  useEffect(() => {
    let isMounted = true;

    async function loadFavoriteState() {
      if (!productId) {
        setIsReady(true);
        return;
      }

      try {
        const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (isMounted) {
          setIsFavorite(Boolean(data.isFavorite));
          setIsReady(true);
        }
      } catch (error) {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadFavoriteState();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  function handleClick() {
    if (isDisabled) {
      return;
    }

    const nextIsFavorite = !isFavorite;
    setIsFavorite(nextIsFavorite);

    startTransition(async () => {
      try {
        const response = await fetch("/api/wishlist", {
          method: nextIsFavorite ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (response.status === 401) {
          setIsFavorite(false);
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }

        if (!response.ok) {
          setIsFavorite(!nextIsFavorite);
          return;
        }

        const data = await response.json();
        setIsFavorite(Boolean(data.isFavorite));
      } catch (error) {
        setIsFavorite(!nextIsFavorite);
      }
    });
  }

  return (
    <button
      type="button"
      className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteButtonActive : ""}`}
      aria-label={`${isFavorite ? "Quitar" : "Agregar"} ${productName} ${isFavorite ? "de" : "a"} favoritos`}
      aria-pressed={isFavorite}
      disabled={isDisabled}
      onClick={handleClick}
    >
      <Heart
        size={20}
        strokeWidth={2}
        fill={isFavorite ? "currentColor" : "none"}
        aria-hidden="true"
      />
      <span className="sr-only">{isReady && isFavorite ? "Guardado en favoritos" : "Agregar a favoritos"}</span>
    </button>
  );
}
