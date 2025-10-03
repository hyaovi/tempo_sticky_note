import type { Size } from "../types";

export const MIN_NOTE_SIZE = { width: 200, height: 200 } as const;
export const MAX_NOTE_SIZE = { width: 400, height: 400 } as const;
export const MEDIUM_NOTE_SIZE = { width: 300, height: 300 } as const;

export const DEFAULT_NOTE_SIZE = { width: 300, height: 300 };
export const TRASH_ZONE_SIZE = { width: 120, height: 120 };
export const RESIZE_HANDLE_SIZE = 12;
export const NOTE_COLORS = [
  "#ffd700",
  "#ff69b4",
  "#87ceeb",
  "#98fb98",
  "#dda0dd",
  "#f0e68c",
];
export const TRANSITION_DURATION = 200;
export const DEFAULt_SCREEN_BOUND: Size = {
  width: 1024,
  height: 768,
};
export const MAX_Z_INDEX = 999999;
export const Z_INDEX_NORMALIZATION_THRESHOLD = MAX_Z_INDEX - 1000;

export const IS_DEV_ENV = true;
