import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Note, NotesMap, NoteUpdateData, Position, Size } from "../types";
import {
  clamp,
  generateId,
  getRandomNoteSize,
  getRandomStickyNoteColor,
} from "../utils";
import {
  MAX_NOTE_SIZE,
  MIN_NOTE_SIZE,
  Z_INDEX_NORMALIZATION_THRESHOLD,
} from "../constants";

export interface NoteManager {
  notes: NotesMap;
  notesArray: readonly Note[];
  createNote: (option?: CreateNoteOption) => Note;
  deleteNote: (id: string) => boolean;
  updateNote: (id: string, updates: NoteUpdateData) => boolean;
  bringToFront: (id: string) => boolean;
  getNote: (id: string) => Note | undefined;
}

export interface CreateNoteOption {
  position?: Position;
  size?: Size;
}

const POSITION_MARGIN = 50;
const RESIZE_DEBOUNCE_MS = 150;

export function useNoteManager(): NoteManager {
  const [notes, setNotes] = useState<NotesMap>(new Map());
  const [currentZIndex, setCurrentZIndex] = useState(0);

  const boundsRef = useRef<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const currentZIndexRef = useRef(0);
  const resizeTimeoutRef = useRef<number | null>(null);

  currentZIndexRef.current = currentZIndex;

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);

      resizeTimeoutRef.current = window.setTimeout(() => {
        boundsRef.current = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  const generateRandomPosition = useCallback((size: Size): Position => {
    const { width, height } = boundsRef.current;
    const margin = POSITION_MARGIN;

    const maxX = Math.max(margin, width - size.width - margin);
    const maxY = Math.max(margin, height - size.height - margin);

    return {
      x: clamp(Math.random() * (maxX - margin) + margin, margin, maxX),
      y: clamp(Math.random() * (maxY - margin) + margin, margin, maxY),
    };
  }, []);

  const getNextZIndex = useCallback((): number => {
    const nextZ = currentZIndexRef.current + 1;
    currentZIndexRef.current = nextZ;
    setCurrentZIndex(nextZ);
    return nextZ;
  }, []);

  const normalizeZIndexes = useCallback(() => {
    setNotes((prev) => {
      const sorted = Array.from(prev.values()).sort(
        (a, b) => a.zIndex - b.zIndex
      );

      const normalized = new Map<string, Note>();
      sorted.forEach((note, idx) =>
        normalized.set(note.id, { ...note, zIndex: idx + 1 })
      );

      const maxZ = sorted.length;
      setCurrentZIndex(maxZ);
      currentZIndexRef.current = maxZ;

      return normalized;
    });
  }, []);

  const createNote = useCallback(
    (option?: CreateNoteOption): Note => {
      const requestedSize = option?.size ?? getRandomNoteSize();

      const size: Size = {
        width: clamp(
          requestedSize.width,
          MIN_NOTE_SIZE.width,
          MAX_NOTE_SIZE.width
        ),
        height: clamp(
          requestedSize.height,
          MIN_NOTE_SIZE.height,
          MAX_NOTE_SIZE.height
        ),
      };

      const position = option?.position ?? generateRandomPosition(size);

      // xxx hyaovi: normalize when zIndex grows too large
      if (currentZIndexRef.current >= Z_INDEX_NORMALIZATION_THRESHOLD) {
        normalizeZIndexes();
      }

      const now = Date.now();
      const note: Note = {
        id: generateId(),
        position,
        size,
        content: "",
        zIndex: getNextZIndex(),
        color: getRandomStickyNoteColor(),
        createdAt: now,
        updatedAt: now,
      };

      setNotes((prev) => {
        const copy = new Map(prev);
        copy.set(note.id, note);
        return copy;
      });

      return note;
    },
    [generateRandomPosition, getNextZIndex, normalizeZIndexes]
  );

  const deleteNote = useCallback(
    (noteId: string): boolean => {
      if (!notes.has(noteId)) return false;

      setNotes((prev) => {
        const copy = new Map(prev);
        copy.delete(noteId);
        return copy;
      });

      return true;
    },
    [notes]
  );

  const updateNote = useCallback(
    (id: string, updates: NoteUpdateData): boolean => {
      if (!notes.has(id)) return false;

      setNotes((prev) => {
        const copy = new Map(prev);
        const note = copy.get(id);
        if (note) {
          copy.set(id, { ...note, ...updates, updatedAt: Date.now() });
        }
        return copy;
      });

      return true;
    },
    [notes]
  );

  const getNote = useCallback((id: string) => notes.get(id), [notes]);

  const bringToFront = useCallback(
    (id: string): boolean => {
      const note = notes.get(id);
      if (!note) return false;

      if (note.zIndex >= currentZIndexRef.current) return false;

      if (currentZIndexRef.current >= Z_INDEX_NORMALIZATION_THRESHOLD) {
        normalizeZIndexes();
      }

      updateNote(id, { zIndex: getNextZIndex() });
      return true;
    },
    [notes, getNextZIndex, normalizeZIndexes, updateNote]
  );

  const notesArray = useMemo(() => Array.from(notes.values()), [notes]);

  return {
    notes,
    notesArray,
    createNote,
    deleteNote,
    updateNote,
    getNote,
    bringToFront,
  };
}
