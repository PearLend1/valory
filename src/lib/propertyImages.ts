/**
 * Property Image Utility
 *
 * Maps property IDs and types to curated Unsplash photos of
 * English residential properties. Used as a stand-in until
 * vendor-uploaded images are available.
 *
 * Images are deterministic (same property always gets the same photo)
 * but varied across the pool so listings look distinct.
 */

const HOUSE_PHOTOS = [
  'photo-1568605114967-8130f3a36994', // detached — stone front
  'photo-1600596542815-ffad4c1539a9', // modern detached — white render
  'photo-1600585154340-be6161a56a0c', // large detached — brick
  'photo-1523217582562-09d0def993a6', // traditional detached
  'photo-1628744448840-55bdb2497bd4', // country house — period
  'photo-1582268611958-ebfd161ef9cf', // semi-detached — red brick
];

const FLAT_PHOTOS = [
  'photo-1512917774080-9991f1c4c750', // modern apartment block
  'photo-1564013799919-ab600027ffc6', // apartment exterior
  'photo-1536376072261-38c75010e6c9', // converted flat building
];

const TERRACE_PHOTOS = [
  'photo-1558618666-fcd25c85cd64', // Victorian terrace
  'photo-1570129477492-45c003edd2be', // cottage terrace
  'photo-1464082354059-27db6ce50048', // stone terrace row
];

const BUNGALOW_PHOTOS = [
  'photo-1572120360610-d971b9d7767c', // bungalow
  'photo-1568605114967-8130f3a36994', // fallback
];

const DEFAULT_POOL = [
  ...HOUSE_PHOTOS,
  ...TERRACE_PHOTOS,
  FLAT_PHOTOS[0],
];

function pickFromPool(pool: string[], propertyId: number): string {
  return pool[propertyId % pool.length];
}

/**
 * Returns a deterministic Unsplash image URL for a given property.
 * @param propertyId  — numeric DB id (used for deterministic selection)
 * @param propertyType — e.g. 'house', 'flat', 'apartment', 'terraced', 'bungalow'
 * @param width       — image width in pixels (default 640)
 * @param height      — image height in pixels (default 960)
 */
export function getPropertyImageUrl(
  propertyId: number,
  propertyType?: string | null,
  width = 640,
  height = 960,
): string {
  const t = (propertyType ?? '').toLowerCase();

  let pool = DEFAULT_POOL;
  if (t.includes('flat') || t.includes('apartment')) pool = FLAT_PHOTOS;
  else if (t.includes('terrace') || t.includes('terraced')) pool = TERRACE_PHOTOS;
  else if (t.includes('bungalow')) pool = BUNGALOW_PHOTOS;
  else if (
    t.includes('house') ||
    t.includes('detach') ||
    t.includes('semi') ||
    t.includes('town')
  ) pool = HOUSE_PHOTOS;

  const photoId = pickFromPool(pool, propertyId);
  return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&q=82&auto=format`;
}

/**
 * Returns a lower-resolution thumbnail URL (e.g. for listing cards).
 */
export function getPropertyThumbnailUrl(
  propertyId: number,
  propertyType?: string | null,
): string {
  return getPropertyImageUrl(propertyId, propertyType, 400, 280);
}
