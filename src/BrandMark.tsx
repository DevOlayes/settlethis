import React from "react";

/**
 * Settle This! monogram — the C-direction concept.
 * A single, custom-drawn S silhouette with confident horizontal terminals
 * and a decisive diagonal waist. Designed to stay legible on the gold coin.
 */
export default function BrandMark({className=""}:{className?:string}) {
  return <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Settle This" xmlns="http://www.w3.org/2000/svg">
    <path d="M87 10 76 26H43C32 26 27 30 27 37c0 6 4 10 15 15l20 9c17 8 25 17 25 31 0 18-14 28-36 28H8l11-16h32c11 0 17-4 17-11 0-6-4-10-15-15l-20-9C16 61 8 52 8 38 8 20 22 10 44 10h43Z" transform="translate(0 -8) scale(1 0.82)" fill="currentColor"/>
  </svg>;
}
