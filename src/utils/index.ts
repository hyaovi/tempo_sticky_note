import {
  MAX_NOTE_SIZE,
  MEDIUM_NOTE_SIZE,
  MIN_NOTE_SIZE,
  NOTE_COLORS,
} from "../constants";
import type { Size } from "../types";

export const generateId = (): string =>
  `note-${Date.now()}-${crypto.randomUUID()}`;

export const getRandomStickyNoteColor = (): string =>
  NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
const sizes: Size[] = [MAX_NOTE_SIZE, MIN_NOTE_SIZE, MEDIUM_NOTE_SIZE];
export const getRandomNoteSize = (): Size => {
  return { ...sizes[Math.floor(Math.random() * sizes.length)] };
};
