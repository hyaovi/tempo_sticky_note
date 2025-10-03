import type React from "react";
import { useCallback } from "react";
import { useDrag } from "../../hooks/useDrag";
import type { NoteManager } from "../../hooks/useNotes";
import type { Note, Position, Size } from "../../types";
import StickyNote from "../Note/StickyNote";
import { IS_DEV_ENV } from "../../constants";

interface NoteBoardProps {
  readonly noteManager: NoteManager;
}

function NoteBoard({ noteManager }: NoteBoardProps): React.ReactElement {
  const { updateNote, getNote, notesArray, deleteNote, bringToFront } =
    noteManager;

  const handleDragStart = useCallback(
    (noteId: string, type: "move" | "resize") => {
      // xxx hyaovi: make note comes to front when dragging begins
      bringToFront(noteId);

      if (IS_DEV_ENV) {
        console.log(`[Drag] Started ${type}:`, noteId);
      }
    },
    [bringToFront]
  );

  const handleDragMove = useCallback(
    (noteId: string, position: Position) => {
      updateNote(noteId, { position });
    },
    [updateNote]
  );

  const handleDragEnd = useCallback(
    (noteId: string, finalPosition: Position) => {
      if (IS_DEV_ENV) {
        console.log(`[Drag] Ended:`, noteId, finalPosition);
      }
    },
    []
  );

  const handleResize = useCallback(
    (noteId: string, size: Size, position: Position) => {
      // xxx hyaovi: update both size and position to respect constraints
      updateNote(noteId, { size, position });
    },
    [updateNote]
  );

  const handleResizeEnd = useCallback((noteId: string, finalSize: Size) => {
    if (IS_DEV_ENV) {
      console.log(`[Resize] Ended:`, noteId, finalSize);
    }
  }, []);

  const { handlers, isDragging, isResizing } = useDrag<Note>({
    callbacks: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onResize: handleResize,
      onResizeEnd: handleResizeEnd,
      getItem: getNote,
    },
    rafEnabled: true,
  });

  return (
    <div className="app-board" style={{ position: "relative" }}>
      {notesArray.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          deleteNote={deleteNote}
          updateNote={updateNote}
          dragHandlers={handlers}
          isDragging={isDragging(note.id)}
          isResizing={isResizing(note.id)}
        />
      ))}
    </div>
  );
}

export default NoteBoard;
