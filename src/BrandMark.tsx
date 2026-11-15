import React from "react";

/**
 * Settle This! — approved Option C monogram.
 * Bespoke, solid S silhouette with the long upper terminal and
 * sweeping lower return from the selected reference.
 */
export default function BrandMark({className=""}:{className?:string}) {
  return <svg className={className} viewBox="0 0 400 300" role="img" aria-label="Settle This" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="
      M 390 12
      L 344 68
      H 177
      C 145 68 126 82 126 103
      C 126 120 138 132 164 145
      L 265 196
      C 288 208 300 222 300 240
      C 300 270 276 288 232 288
      H 12
      L 58 230
      H 211
      C 234 230 247 220 247 204
      C 247 190 237 180 216 169
      L 116 119
      C 83 102 65 82 65 55
      C 65 22 91 0 137 0
      H 400
      Z
    "/>
  </svg>;
}
