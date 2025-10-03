export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Note {
  id: string;
  position: Position;
  size: Size;
  content: string;
  zIndex: number;
  color: string;
  updatedAt: number;
  createdAt: number;
}
export type NoteUpdateData = Partial<
  Omit<Note, "id" | "createdAt" | "updatedAt">
>;

export type NotesMap = Map<string, Note>;
