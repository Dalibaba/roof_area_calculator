/**
 * Returns distance between two geocoordinates
 *
 * @param {number} lat1 latitude of first coordinate.
 * @param {number} lon1 longitude of first coordinate.
 * @param {number} lat2 latitude of second coordinate.
 * @param {number} lon2 longitude of second coordinate.
 * @return {number} d distance between geocoordinates
 */

function distanceCalculator(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}

/**
 * Calculates surface of a rectangle by taking the average side
 *
 * @param {array} array of 4 distance values
 * @return {number} surface of rectangle
 */

function surfaceCalculator(distanceArray) {
  if (distanceArray.length == 4) {
    const sideA = (distanceArray[0] + distanceArray[2]) / 2;
    const sideB = (distanceArray[1] + distanceArray[3]) / 2;
    const surface = sideA * sideB;
    return surface.toFixed(4);
  } else {
    return 0;
  }
}

export { distanceCalculator, surfaceCalculator };
