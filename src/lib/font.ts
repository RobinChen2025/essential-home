import opentype from "opentype.js";

let cachedFontPromise: Promise<opentype.Font> | null = null;

export function loadNdotFont(): Promise<opentype.Font> {
  if (!cachedFontPromise) {
    cachedFontPromise = opentype.load("/fonts/Ndot-55.otf");
  }
  return cachedFontPromise;
}


