import React from "react";

/**
 * The Settle This! split-ribbon mark.
 * Two opposing angular strokes create a single S-shaped reading.
 * The deliberate centre cut represents the two sides of a debate;
 * the uninterrupted outer silhouette keeps it legible on a coin.
 */
export default function BrandMark({className=""}:{className?:string}) {
  return <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Settle This" xmlns="http://www.w3.org/2000/svg">
    <path d="M82 12H42C30 12 20 20 12 31V40L40 54L54 40L34 29L39 25H70Z" fill="currentColor"/>
    <path d="M18 88H58C70 88 80 80 88 69V60L60 46L46 60L66 71L61 75H30Z" fill="currentColor"/>
  </svg>;
}
