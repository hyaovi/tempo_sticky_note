import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, Position, Size } from "../types";
import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from "../constants";

export type DragType = "move" | "resize";

interface DragState {
  noteId: string | null;
  type: DragType | null;
  startMousePosition: Position;
  startNotePosition: Position;
  startNoteSize: Size;
  mouseOffset: Position;
}

export interface DragCallbacks<T> {
  onDragStart?: (noteId: string, type: DragType) => void;
  onDragMove: (noteId: string, position: Position) => void;
  onDragEnd?: (noteId: string, position: Position) => void;
  onResizeStart?: (noteId: string) => void;
  onResize?: (noteId: string, size: Size, position: Position) => void;
  onResizeEnd?: (noteId: string, size: Size) => void;
  getItem: (noteId: string) => T | undefined;
}

export interface DragConfig {
  rafEnabled?: boolean;
  minSize?: Size;
  maxSize?: Size;
}

export interface DragHandlers {
  onMouseDown: (
    event: React.MouseEvent,
    noteId: string,
    position: Position,
    size: Size
  ) => void;
  onResizeMouseDown: (
    event: React.MouseEvent,
    noteId: string,
    position: Position,
    size: Size
  ) => void;
}

export interface UseDragReturn {
  handlers: DragHandlers;
  isDragging: (noteId: string) => boolean;
  isResizing: (noteId: string) => boolean;
  activeDragNoteId: string | null;
  currentDragType: DragType | null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export function useDrag<T>(
  config: { callbacks: DragCallbacks<T> } & DragConfig
): UseDragReturn {
  const { callbacks, rafEnabled = true } = config;

  const [dragState, setDragState] = useState<DragState>({
    noteId: null,
    type: null,
    startMousePosition: { x: 0, y: 0 },
    startNotePosition: { x: 0, y: 0 },
    startNoteSize: { width: 0, height: 0 },
    mouseOffset: { x: 0, y: 0 },
  });

  const rafRef = useRef<number | null>(null);
  const callbacksRef = useRef(callbacks);
  const minSizeRef = useRef(config.minSize ?? MIN_NOTE_SIZE);
  const maxSizeRef = useRef(config.maxSize ?? MAX_NOTE_SIZE);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    minSizeRef.current = config.minSize ?? MIN_NOTE_SIZE;
    maxSizeRef.current = config.maxSize ?? MAX_NOTE_SIZE;
  }, [config.minSize, config.maxSize]);

  const handleMoveOperation = useCallback(
    (mousePos: Position, state: DragState) => {
      if (!state.noteId) return;
      callbacksRef.current.onDragMove(state.noteId, {
        x: mousePos.x - state.mouseOffset.x,
        y: mousePos.y - state.mouseOffset.y,
      });
    },
    []
  );

  const handleResizeOperation = useCallback(
    (mousePos: Position, state: DragState) => {
      if (!state.noteId) return;
      const deltaX = mousePos.x - state.startMousePosition.x;
      const deltaY = mousePos.y - state.startMousePosition.y;

      const newSize: Size = {
        width: clamp(
          state.startNoteSize.width + deltaX,
          minSizeRef.current.width,
          maxSizeRef.current.width
        ),
        height: clamp(
          state.startNoteSize.height + deltaY,
          minSizeRef.current.height,
          maxSizeRef.current.height
        ),
      };

      // xxx hyaovi: only resizing bottom-right, so position stays unchanged
      callbacksRef.current.onResize?.(
        state.noteId,
        newSize,
        state.startNotePosition
      );
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.noteId || !dragState.type) return;

      const runUpdate = () => {
        const pos = { x: event.clientX, y: event.clientY };
        if (dragState.type === "move") handleMoveOperation(pos, dragState);
        else if (dragState.type === "resize")
          handleResizeOperation(pos, dragState);
      };

      if (rafEnabled) {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(runUpdate);
      } else {
        runUpdate();
      }
    },
    [dragState, rafEnabled, handleMoveOperation, handleResizeOperation]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState.noteId) return;

    const { noteId, type } = dragState;
    const item = callbacksRef.current.getItem(noteId) as Note;
    if (!item) return;

    if (type === "move" && callbacksRef.current.onDragEnd && item) {
      callbacksRef.current.onDragEnd(noteId, item.position);
    } else if (type === "resize" && callbacksRef.current.onResizeEnd && item) {
      callbacksRef.current.onResizeEnd(noteId, item.size);
    }

    setDragState({
      noteId: null,
      type: null,
      startMousePosition: { x: 0, y: 0 },
      startNotePosition: { x: 0, y: 0 },
      startNoteSize: { width: 0, height: 0 },
      mouseOffset: { x: 0, y: 0 },
    });

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [dragState]);

  useEffect(() => {
    if (!dragState.type) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [dragState.type, handleMouseMove, handleMouseUp]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, noteId: string, pos: Position, size: Size) => {
      e.preventDefault(); // xxx hyaovi: block text-selection while dragging

      const mousePos = { x: e.clientX, y: e.clientY };
      const offset = { x: mousePos.x - pos.x, y: mousePos.y - pos.y };

      setDragState({
        noteId,
        type: "move",
        startMousePosition: mousePos,
        startNotePosition: { ...pos },
        startNoteSize: { ...size },
        mouseOffset: offset,
      });

      callbacksRef.current.onDragStart?.(noteId, "move");
    },
    []
  );

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, noteId: string, pos: Position, size: Size) => {
      e.stopPropagation();
      e.preventDefault();

      const mousePos = { x: e.clientX, y: e.clientY };

      setDragState({
        noteId,
        type: "resize",
        startMousePosition: mousePos,
        startNotePosition: { ...pos },
        startNoteSize: { ...size },
        mouseOffset: { x: 0, y: 0 },
      });

      callbacksRef.current.onResizeStart?.(noteId);
    },
    []
  );

  const isDragging = useCallback(
    (noteId: string) =>
      dragState.noteId === noteId && dragState.type === "move",
    [dragState.noteId, dragState.type]
  );

  const isResizing = useCallback(
    (noteId: string) =>
      dragState.noteId === noteId && dragState.type === "resize",
    [dragState.noteId, dragState.type]
  );

  return {
    handlers: { onMouseDown, onResizeMouseDown },
    isDragging,
    isResizing,
    activeDragNoteId: dragState.noteId,
    currentDragType: dragState.type,
  };
}
