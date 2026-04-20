// SF zip code set — used to gate auto-approval when a license isn't in the ELFA list.
// Source: USPS SF 94xxx residential zips. Edge cases (e.g. 94130 Treasure Island) included.

const SF_ZIPS = new Set<string>([
  '94102', '94103', '94104', '94105', '94107', '94108', '94109', '94110',
  '94111', '94112', '94114', '94115', '94116', '94117', '94118', '94121',
  '94122', '94123', '94124', '94127', '94129', '94130', '94131', '94132',
  '94133', '94134', '94158',
]);

export function isSfZip(zip: string): boolean {
  return SF_ZIPS.has(zip.trim());
}
