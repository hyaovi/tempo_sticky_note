import type React from "react";
import { useCallback, useEffect, useRef, useState, memo } from "react";
import type { Note, NoteUpdateData } from "../../types";
import type { DragHandlers } from "../../hooks/useDrag";

interface StickyNoteProps {
  note: Note;
  updateNote: (id: string, noteData: NoteUpdateData) => void;
  deleteNote: (id: string) => void;
  dragHandlers: DragHandlers;
  isDragging: boolean;
  isResizing: boolean;
}

const RESIZE_HANDLE_SIZE = 12;

function StickyNoteComponent({
  note,
  updateNote,
  deleteNote,
  dragHandlers,
  isDragging,
  isResizing,
}: StickyNoteProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNote(note.id, { content: e.target.value });
    },
    [note.id, updateNote]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNote(note.id);
    },
    [note.id, deleteNote]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // xxx hyaovi: prevent initiating drag if editing or clicking delete
      if (isEditing || (e.target as HTMLElement).tagName === "BUTTON") return;
      dragHandlers.onMouseDown(e, note.id, note.position, note.size);
    },
    [isEditing, dragHandlers, note.id, note.position, note.size]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragHandlers.onResizeMouseDown(e, note.id, note.position, note.size);
    },
    [dragHandlers, note.id, note.position, note.size]
  );

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const noteStyle: React.CSSProperties = {
    position: "absolute",
    top: note.position.y,
    left: note.position.x,
    width: note.size.width,
    height: note.size.height,
    backgroundColor: note.color,
    borderRadius: 4,
    boxShadow:
      isDragging || isResizing
        ? "0 8px 16px rgba(0,0,0,0.2)"
        : "0 2px 8px rgba(0,0,0,0.1)",
    zIndex: note.zIndex,
    opacity: isDragging ? 0.9 : 1,
    transform: isDragging || isResizing ? "scale(1.02)" : "scale(1)",
    transition:
      isDragging || isResizing
        ? "none"
        : "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: isDragging ? "grabbing" : isEditing ? "text" : "grab",
    userSelect: isEditing ? "text" : "none",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  return (
    <article
      style={noteStyle}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      data-note-id={note.id}
    >
      <header
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(0,0,0,0.6)",
          fontWeight: 500,
          flexShrink: 0,
          pointerEvents: isEditing ? "none" : "auto",
        }}
      >
        <time dateTime={new Date(note.updatedAt).toISOString()}>
          {new Date(note.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            backgroundColor: "rgba(231,76,60,0.1)",
            color: "#e74c3c",
            border: "1px solid rgba(231,76,60,0.3)",
            borderRadius: 3,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontWeight: 500,
          }}
          aria-label={`Delete note ${note.id}`}
        >
          Delete
        </button>
      </header>

      <div
        style={{
          flex: 1,
          padding: 12,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            style={{
              resize: "none",
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: 14,
              fontFamily: "inherit",
              lineHeight: "1.5",
            }}
            name={`stickynote-${note.id}`}
            value={note.content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Note content"
          />
        ) : (
          <p
            style={{
              width: "100%",
              height: "100%",
              fontSize: 14,
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflow: "auto",
              color: note.content ? "inherit" : "rgba(0,0,0,0.4)",
            }}
          >
            {note.content || "Double-click to edit"}
          </p>
        )}
      </div>

      {!isEditing && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
            cursor: "nwse-resize",
            zIndex: 10,
            opacity: isEditing ? 0 : isResizing ? 1 : 0.5,
            transition: "opacity 0.2s ease",
          }}
          onMouseDown={handleResizeMouseDown}
          aria-label="Resize note"
          role="button"
          tabIndex={-1}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              padding: 2,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 1L1 11M11 5L5 11M11 9L9 11"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </article>
  );
}

const StickyNote = memo(
  StickyNoteComponent,
  (prev, next) =>
    prev.note.id === next.note.id &&
    prev.note.position.x === next.note.position.x &&
    prev.note.position.y === next.note.position.y &&
    prev.note.size.width === next.note.size.width &&
    prev.note.size.height === next.note.size.height &&
    prev.note.content === next.note.content &&
    prev.note.zIndex === next.note.zIndex &&
    prev.note.color === next.note.color &&
    prev.isDragging === next.isDragging &&
    prev.isResizing === next.isResizing
);

StickyNote.displayName = "StickyNote";

export default StickyNote;
