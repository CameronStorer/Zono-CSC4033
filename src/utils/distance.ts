export type Coordinate = {
    latitude: number;
    longitude : number;
};

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number{
    return (degrees * Math.PI) / 180;
}

export function getDistanceMeters( a: Coordinate, b: Coordinate): number{
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);

    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const haversine =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return EARTH_RADIUS_METERS * arc;
}

export function metersToMiles(meters:number): number{
    return meters / 1609.344;
}

export function metersToKilometers(meters: number): number {
  return meters / 1000;
}

export function formatDistance (meters: number): string {
    if (meters < 1000){
        return `${Math.round(meters)} m`;
    }
    const miles = metersToMiles(meters);

    if (miles < 1) {
        return `${metersToKilometers(meters).toFixed(2)} km`;
    }
    return `${miles.toFixed(2)} mi`;
}

// Returns the 8-point compass direction from point A to point B.
// Uses the bearing formula on a sphere (atan2 of cross-track components).
export function compassBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  return dirs[Math.round(bearing / 45) % 8];
}





