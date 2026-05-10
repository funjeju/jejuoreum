const EARTH_R = 6371000; // metres

export function distanceM(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return EARTH_R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function screenX(
  objBearing: number,
  userHeading: number,
  fov: number,
  screenWidth: number,
  margin = 10,
): number | null {
  let rel = objBearing - userHeading;
  if (rel > 180) rel -= 360;
  if (rel < -180) rel += 360;
  if (Math.abs(rel) > fov / 2 + margin) return null;
  return ((rel / fov) + 0.5) * screenWidth;
}

export function screenY(
  objElevation: number,
  userElevation: number,
  distM: number,
  screenHeight: number,
): number {
  const diff = objElevation - userElevation;
  const angleDeg = (Math.atan2(diff, distM) * 180) / Math.PI;
  const vFov = 60;
  return (0.5 - angleDeg / vFov) * screenHeight;
}

export function labelScale(distM: number): number {
  if (distM < 500) return 1.0;
  if (distM < 1000) return 0.9;
  if (distM < 3000) return 0.75;
  if (distM < 10000) return 0.6;
  return 0.5;
}

export function bearingLabel(deg: number): string {
  const dirs = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return dirs[Math.round(deg / 45) % 8];
}

export function formatDist(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}
