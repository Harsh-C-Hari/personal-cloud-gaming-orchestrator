export function SaveBrowser({
  type,
  name,
  saves,
  loading = false,
  error = "",
  deleting = false,
  onTypeChange,
  onNameChange,
  onDelete,
}) {
  const archives = saves?.archives || [];
  const backups = saves?.backups || [];

  const options =
    type === "archives"
      ? archives
      : type === "backups"
        ? backups
        : [];

  const hasSaves =
      saves?.latest_exists ||
      saves.archives.length > 0 ||
      saves.backups.length > 0;

  return (
    <div style={box}>
      <div style={title}>Save Source</div>

      {hasSaves && (
        <select
          style={input}
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          {saves.latest_exists && (
            <option value="latest">
              latest save
            </option>
          )}

          {archives.length > 0 && (
            <option value="archives">
              archive
            </option>
          )}

          {backups.length > 0 && (
            <option value="backups">
              backup
            </option>
          )}
        </select>
      )}

      {loading && (
        <div style={hint}>
          Loading saves…
        </div>
      )}

      {error && (
        <div style={errorText}>
          {error}
        </div>
      )}

      {!loading && !hasSaves && (
          <div style={hint}>
              No saves found for this user.
          </div>
      )}

      {hasSaves && type !== "latest" && (
        <>
          <select
            style={{ ...input, marginTop: "8px" }}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          >
            <option value="">
              Select {type === "archives" ? "archive" : "backup"}
            </option>

            {options.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {name && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              style={deleteButton}
              onMouseEnter={(e) =>
              e.currentTarget.style.background =
                  "rgba(206, 83, 83, 0.14)"
              }

              onMouseLeave={(e) =>
                e.currentTarget.style.background =
                  "rgba(56,189,248,0.01)"
              }
            >
              {deleting
                ? "Deleting…"
                : `Delete ${type === "archives" ? "archive" : "backup"}`}
            </button>
          )}
        </>
      )}

      {type !== "latest" && options.length === 0 && !loading && (
        <div style={hint}>
          No {type === "archives" ? "archives" : "backups"} found
        </div>
      )}
    </div>
  );
}

const box = {
  padding: "10px",
  border: "1px solid #1c2130",
  borderRadius: "6px",
  background: "#05070b",
};

const title = {
  fontSize: "9.5px",
  color: "#475569",
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  fontFamily: "'JetBrains Mono', monospace",
  marginBottom: "8px",
};

const input = {
  width: "100%",
  padding: "9px 12px",
  background: "#080a0f",
  border: "1px solid #1c2130",
  borderRadius: "5px",
  color: "#e2e8f0",
  fontSize: "12px",
  boxSizing: "border-box",
};

const hint = {
  marginTop: "8px",
  fontSize: "10px",
  color: "#475569",
  fontFamily: "'JetBrains Mono', monospace",
};

const errorText = {
  marginTop: "8px",
  fontSize: "10px",
  color: "#f43f5e",
  fontFamily: "'JetBrains Mono', monospace",
};

const deleteButton = {
  width: "100%",
  marginTop: "8px",
  padding: "8px 10px",
  background: "rgba(244,63,94,0.08)",
  border: "1px solid rgba(244,63,94,0.35)",
  borderRadius: "5px",
  color: "#f43f5e",
  fontSize: "10px",
  fontFamily: "'JetBrains Mono', monospace",
  cursor: "pointer",
};