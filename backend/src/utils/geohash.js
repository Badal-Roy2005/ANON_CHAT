import ngeohash from 'ngeohash';

const MIN_PRECISION = 1;
const MAX_PRECISION = 12;

export function getGeohashCell(lat, lng, precision = 6) {
  if (typeof lat !== 'number' || Number.isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error('getGeohashCell: latitude must be a number between -90 and 90');
  }
  if (typeof lng !== 'number' || Number.isNaN(lng) || lng < -180 || lng > 180) {
    throw new Error('getGeohashCell: longitude must be a number between -180 and 180');
  }
  if (
    !Number.isInteger(precision) ||
    precision < MIN_PRECISION ||
    precision > MAX_PRECISION
  ) {
    throw new Error('getGeohashCell: precision must be an integer between 1 and 12');
  }
  return ngeohash.encode(lat, lng, precision);
}

export function getNeighborCells(geohash) {
  if (typeof geohash !== 'string' || geohash.trim().length === 0) {
    throw new Error('getNeighborCells: geohash must be a non-empty string');
  }
  const neighbors = ngeohash.neighbors(geohash);
  return [geohash, ...Object.values(neighbors)];
}