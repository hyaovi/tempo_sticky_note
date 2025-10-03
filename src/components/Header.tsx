interface HeaderProps {
  createNote: () => void;
}
function AppHeader({ createNote }: HeaderProps) {
  return (
    <nav
      className="app-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <h1 style={{ fontSize: "20px" }}>StickyNotes</h1>
      <button
        onClick={createNote}
        style={{
          WebkitAppearance: "none",
          appearance: "none",
        }}
      >
        Add note
      </button>
    </nav>
  );
}

export default AppHeader;
