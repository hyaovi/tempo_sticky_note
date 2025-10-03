import "./styles/App.css";
import AppHeader from "./components/Header";
import NoteBoard from "./components/Board/NoteBoard";
import { useNoteManager } from "./hooks/useNotes";

function App() {
  const noteManager = useNoteManager();

  return (
    <main className="app">
      <AppHeader createNote={noteManager.createNote} />
      <NoteBoard noteManager={noteManager} />
    </main>
  );
}

export default App;
