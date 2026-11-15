import React from "react";

/**
 * The Settle This! split-ribbon mark.
 * Two opposing, angular strokes form one continuous visual S:
 * the open centre is intentional negative space, not a frame.
 * It is drawn as filled geometry so it remains strong on a coin,
 * at app-icon size, and in single-colour production.
 */
export default function BrandMark({className=""}:{className?:string}) {
  return <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Settle This" xmlns="http://www.w3.org/2000/svg">
    <path d="M82 11H41C22 11 10 22 10 39c0 12 7 20 22 28l25 14 17-17-29-17c-8-4-11-7-11-11 0-5 4-8 11-8h25L82 11Z" fill="currentColor"/>
    <path d="M18 89h41c19 0 31-11 31-28 0-12-7-20-22-28L43 19 26 36l29 17c8 4 11 7 11 11 0 5-4 8-11 8H30L18 89Z" fill="currentColor"/>
  </svg>;
}
