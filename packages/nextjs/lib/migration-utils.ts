/**
 * Utility functions for data migration
 */

export function getDataSize(data: any): number {
  return JSON.stringify(data).length;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function cleanMatchData(match: any): any {
  // Remove potentially large or unnecessary fields
  const cleaned = { ...match };

  // Remove debug/metadata fields that might be large
  delete cleaned.metadata;
  delete cleaned.rawData;
  delete cleaned.debug;
  delete cleaned.fullHistory;
  delete cleaned.logs;

  // Truncate very long text fields
  if (cleaned.description && cleaned.description.length > 1000) {
    cleaned.description = cleaned.description.substring(0, 1000) + "...";
  }

  if (cleaned.notes && cleaned.notes.length > 500) {
    cleaned.notes = cleaned.notes.substring(0, 500) + "...";
  }

  return cleaned;
}

export function validateMatchSize(
  match: any,
  maxSize: number = 100000,
): { valid: boolean; size: number; cleaned?: any } {
  const cleaned = cleanMatchData(match);
  const size = getDataSize(cleaned);

  return {
    valid: size <= maxSize,
    size,
    cleaned: size <= maxSize ? cleaned : undefined,
  };
}
