import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/players";
const MATCH_API_URL = "http://localhost:5000/api/matches";
const SPORTS = ["Football", "Cricket", "Basketball", "Badminton", "Tennis", "Volleyball", "Other"];
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "players", label: "Players", icon: "♙" },
  { id: "games", label: "Games", icon: "⚽" },
  { id: "attendance", label: "Attendance", icon: "☑" },
  { id: "matches", label: "Matches", icon: "⚑" },
  { id: "trials", label: "Trial Readiness", icon: "◎" },
];

const blankForm = { firstName: "", lastName: "", age: "", sport: "", phone: "", email: "", position: "", photo: "" };
const initials = (p) => `${p?.firstName?.[0] || ""}${p?.lastName?.[0] || ""}`.toUpperCase() || "PL";
const fullName = (p) => `${p.firstName || ""} ${p.lastName || ""}`.trim();
const achievementTitles = (p) => (p.achievements || []).map((item) => item.title?.trim()).filter(Boolean);

function Avatar({ player, large = false }) {
  return player.photo ? <img className={`player-avatar-img ${large ? "large" : ""}`} src={player.photo} alt={`${fullName(player)} profile`} /> : <div className={`player-avatar ${large ? "large" : ""}`}>{initials(player)}</div>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <section className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> {eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</section>;
}


function CalendarDatePicker({ value, onChange, placeholder = "Choose date" }) {
  const selected = value ? new Date(`${value}T12:00:00`) : new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  function chooseDay(day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  }
  return <div className="calendar-picker">
    <button type="button" className="calendar-trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
      <span>{value ? selected.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : placeholder}</span><span aria-hidden="true">▦</span>
    </button>
    {open && <div className="calendar-popover">
      <div className="calendar-header"><button type="button" aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}>‹</button><strong>{monthLabel}</strong><button type="button" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>›</button></div>
      <div className="calendar-grid calendar-weekdays">{['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="calendar-grid">{cells.map((day, i) => day ? <button type="button" key={`${year}-${month}-${day}`} className={value === `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` ? 'selected' : ''} onClick={() => chooseDay(day)}>{day}</button> : <span key={`blank-${i}`} />)}</div>
      <div className="calendar-footer"><button type="button" onClick={() => { const today = new Date(); setView(new Date(today.getFullYear(), today.getMonth(), 1)); chooseDay(today.getDate()); }}>Today</button><button type="button" onClick={() => { onChange(''); setOpen(false); }}>Clear</button></div>
    </div>}
  </div>;
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState("");
  const [selectedSport, setSelectedSport] = useState("Football");
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchSaving, setMatchSaving] = useState(false);
  const [matchFormError, setMatchFormError] = useState("");
  const [matchForm, setMatchForm] = useState({ title: "", sport: "Football", date: "", venue: "", opponent: "", status: "Upcoming", result: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("Active");
  const [search, setSearch] = useState("");
  const [noteText, setNoteText] = useState("");
  const [achievement, setAchievement] = useState({ title: "", description: "", date: "" });
  const [detailError, setDetailError] = useState("");

  async function fetchPlayers() {
    try {
      setLoading(true); setLoadError("");
      const response = await fetch(API_URL);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(data.message || "Unable to load players.");
      setPlayers(data);
      if (selectedPlayer) setSelectedPlayer(data.find((p) => p._id === selectedPlayer._id) || null);
    } catch (error) { setLoadError(error.message || "Unable to load players from the server."); }
    finally { setLoading(false); }
  }

  async function fetchMatches() {
    try {
      setMatchesLoading(true); setMatchesError("");
      const response = await fetch(MATCH_API_URL);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(data.message || "Unable to load matches.");
      setMatches(data);
    } catch (error) { setMatchesError(error.message || "Unable to load matches."); }
    finally { setMatchesLoading(false); }
  }

  useEffect(() => { fetchPlayers(); fetchMatches(); }, []);

  function navigate(page) {
    setActivePage(page); setShowForm(false); setEditingPlayer(null); setSelectedPlayer(null); setFormError("");
  }

  function openAddForm() { setEditingPlayer(null); setForm({ ...blankForm }); setFormError(""); setShowForm(true); }
  function openEditForm(player) {
    setEditingPlayer(player);
    setForm({ firstName: player.firstName || "", lastName: player.lastName || "", age: player.age || "", sport: player.sport || "", phone: player.phone || "", email: player.email || "", position: player.position || "", photo: player.photo || "" });
    setFormError(""); setShowForm(true);
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFormError("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setFormError("Choose an image smaller than 8 MB."); return; }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
      });
      const image = new Image(); image.src = dataUrl;
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 640 / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      setForm((current) => ({ ...current, photo: canvas.toDataURL("image/jpeg", 0.78) })); setFormError("");
    } catch { setFormError("Could not read that image. Try another photo."); }
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setFormError("");
    const payload = { ...form, age: Number(form.age) };
    try {
      const response = await fetch(editingPlayer ? `${API_URL}/${editingPlayer._id}` : API_URL, {
        method: editingPlayer ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save player.");
      setPlayers((current) => editingPlayer ? current.map((p) => p._id === result._id ? result : p) : [result, ...current]);
      setShowForm(false); setEditingPlayer(null); setForm({ ...blankForm });
      if (selectedPlayer?._id === result._id) setSelectedPlayer(result);
    } catch (error) { setFormError(error.message); }
    finally { setSaving(false); }
  }

  async function deactivatePlayer(player) {
    const reason = window.prompt(`Why is ${fullName(player)} being moved to inactive?`, "Expelled / Left academy");
    if (reason === null) return;
    try {
      const response = await fetch(`${API_URL}/${player._id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not deactivate player.");
      setPlayers((current) => current.map((p) => p._id === player._id ? result.player : p));
      if (selectedPlayer?._id === player._id) setSelectedPlayer(result.player);
    } catch (error) { window.alert(error.message); }
  }

  async function updatePlayer(playerId, patch) {
    const response = await fetch(`${API_URL}/${playerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not update player.");
    setPlayers((current) => current.map((p) => p._id === playerId ? result : p)); setSelectedPlayer(result);
  }

  async function addNote(event) {
    event.preventDefault(); if (!noteText.trim() || !selectedPlayer) return;
    try { setDetailError(""); await updatePlayer(selectedPlayer._id, { notes: [...(selectedPlayer.notes || []), { text: noteText.trim() }] }); setNoteText(""); }
    catch (error) { setDetailError(error.message); }
  }

  async function addAchievement(event) {
    event.preventDefault(); if (!achievement.title.trim() || !selectedPlayer) return;
    try {
      setDetailError("");
      await updatePlayer(selectedPlayer._id, { achievements: [...(selectedPlayer.achievements || []), { ...achievement, date: achievement.date || null }] });
      setAchievement({ title: "", description: "", date: "" });
    } catch (error) { setDetailError(error.message); }
  }

  const activePlayers = players.filter((p) => (p.status || "Active") === "Active");
  const filteredPlayers = useMemo(() => players.filter((p) => (filter === "All" || (p.status || "Active") === filter) && `${fullName(p)} ${p.sport} ${p.position || ""}`.toLowerCase().includes(search.toLowerCase())), [players, filter, search]);
  const pageTitles = { dashboard: "Dashboard", players: "Players", games: "Games", attendance: "Attendance", matches: "Matches", trials: "Trial Readiness" };

  function renderPlayerForm() {
    if (!showForm) return null;
    return <section className="panel player-form-card">
      <div className="section-heading"><div><h2>{editingPlayer ? "Edit Player Details" : "Register New Player"}</h2><p>Fields marked with * are required</p></div><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Close</button></div>
      <form onSubmit={handleSubmit}>
        <div className="photo-upload-row"><div className="photo-preview">{form.photo ? <img src={form.photo} alt="Player preview" /> : <span>{editingPlayer ? initials(editingPlayer) : "＋"}</span>}</div><div><label className="field-label" htmlFor="player-photo">Player photo <span className="muted-inline">(optional)</span></label><input id="player-photo" type="file" accept="image/*" onChange={handlePhoto} /><small>Image is resized before saving. Maximum upload size: 8 MB.</small>{form.photo && <button className="text-button" type="button" onClick={() => setForm((f) => ({ ...f, photo: "" }))}>Remove photo</button>}</div></div>
        <div className="player-form-grid">
          <label>First name *<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required maxLength="80" /></label>
          <label>Last name *<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required maxLength="80" /></label>
          <label>Age *<input type="number" min="5" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required /></label>
          <label>Sport *<select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} required><option value="">Select sport</option>{SPORTS.map((sport) => <option key={sport}>{sport}</option>)}</select></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength="30" /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength="160" /></label>
          <label>Position<input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} maxLength="80" /></label>
          {editingPlayer && <label>Status<select value={form.status || editingPlayer.status || "Active"} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label>}
        </div>
        {formError && <p className="form-error">{formError}</p>}
        <div className="player-form-actions"><button className="primary-button" disabled={saving}>{saving ? "Saving..." : editingPlayer ? "Save Changes" : "Register Player"}</button><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
      </form>
    </section>;
  }

  function renderPlayerProfile() {
    if (!selectedPlayer) return null;
    const p = selectedPlayer;
    return <section className="profile-page">
      <button className="back-button" onClick={() => setSelectedPlayer(null)}>← Back to Players</button>
      <div className="panel profile-hero"><Avatar player={p} large /><div className="profile-main"><span className={`status-pill ${(p.status || "Active") === "Active" ? "status-active" : "status-inactive"}`}>{p.status || "Active"}</span><h1>{fullName(p)}</h1><p>{p.sport}{p.position ? ` · ${p.position}` : ""} · Age {p.age}</p></div><button className="primary-button" onClick={() => openEditForm(p)}>Edit Player</button></div>
      {renderPlayerForm()}
      <div className="profile-info-grid"><article className="panel"><h2>Personal Information</h2><dl className="info-list"><div><dt>Phone</dt><dd>{p.phone || "Not provided"}</dd></div><div><dt>Email</dt><dd>{p.email || "Not provided"}</dd></div><div><dt>Sport</dt><dd>{p.sport}</dd></div><div><dt>Position</dt><dd>{p.position || "Not specified"}</dd></div><div><dt>Age</dt><dd>{p.age}</dd></div><div><dt>Status reason</dt><dd>{p.statusReason || "—"}</dd></div></dl>{(p.status || "Active") === "Active" && <button className="danger-button" onClick={() => deactivatePlayer(p)}>Deactivate player</button>}</article>
        <article className="panel"><h2>Player Notes</h2><form className="stack-form" onSubmit={addNote}><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a training, performance or conduct note..." rows="3" maxLength="2000" required /><button className="primary-button">Add Note</button></form><div className="record-list">{(p.notes || []).length ? [...p.notes].reverse().map((note) => <div className="record-item" key={note._id || note.createdAt}><p>{note.text}</p><small>{note.createdAt ? new Date(note.createdAt).toLocaleString("en-IN") : "Recently added"}</small></div>) : <p className="muted-text">No notes added yet.</p>}</div></article>
        <article className="panel achievements-panel"><h2>Achievements</h2><form className="stack-form" onSubmit={addAchievement}><input placeholder="Achievement title" value={achievement.title} onChange={(e) => setAchievement({ ...achievement, title: e.target.value })} required maxLength="120" /><textarea placeholder="Description (optional)" rows="2" value={achievement.description} onChange={(e) => setAchievement({ ...achievement, description: e.target.value })} maxLength="1000" /><label>Achievement date<CalendarDatePicker value={achievement.date} onChange={(date) => setAchievement((current) => ({ ...current, date }))} /></label><button className="primary-button">Add Achievement</button></form><div className="record-list">{(p.achievements || []).length ? [...p.achievements].reverse().map((item) => <div className="record-item" key={item._id || item.createdAt}><strong>🏆 {item.title}</strong>{item.description && <p>{item.description}</p>}<small>{item.date ? new Date(item.date).toLocaleDateString("en-IN") : "Date not specified"}</small></div>) : <p className="muted-text">No achievements recorded yet.</p>}</div></article>
      </div>{detailError && <p className="form-error">{detailError}</p>}
    </section>;
  }

  function renderDashboard() {
    return <><PageHeading eyebrow="ACADEMY OVERVIEW" title="Good morning, Admin ✦" description="Here's what's happening at your academy today." action={<button className="primary-button" onClick={() => { navigate("players"); openAddForm(); }}>＋ Add New Player</button>} />
      <section className="hero-banner"><div className="hero-content"><span className="hero-kicker">SPORTSYNC ACADEMY</span><h2>Build champions.<br />Shape the future.</h2><p>One academy. Every sport. Endless possibilities.</p></div><div className="hero-image-overlay" /><div className="hero-image-label">PERFORMANCE STARTS HERE</div></section>
      <section className="stats-grid"><article className="stat-card"><div className="stat-top"><span className="stat-label">Total Players</span><div className="stat-icon">👥</div></div><div className="stat-value">{loading ? "..." : players.length}</div><div className="stat-change">All registered records</div></article><article className="stat-card"><div className="stat-top"><span className="stat-label">Active Players</span><div className="stat-icon">✓</div></div><div className="stat-value">{activePlayers.length}</div><div className="stat-change">Currently enrolled</div></article><article className="stat-card"><div className="stat-top"><span className="stat-label">Sports Represented</span><div className="stat-icon">◎</div></div><div className="stat-value">{new Set(activePlayers.map((p) => p.sport)).size}</div><div className="stat-change">With active players</div></article><article className="stat-card"><div className="stat-top"><span className="stat-label">Inactive Players</span><div className="stat-icon">—</div></div><div className="stat-value">{players.length - activePlayers.length}</div><div className="stat-change">Historical records retained</div></article></section>
      <section className="panel recent-players"><div className="section-heading"><div><h2>Recent Players</h2><p>Latest registered academy players</p></div><button className="text-button" onClick={() => navigate("players")}>View all ↗</button></div>{loading ? <p>Loading players...</p> : loadError ? <p>{loadError}</p> : players.length === 0 ? <p>No players registered yet.</p> : <div className="players-list">{players.slice(0, 5).map((p) => <button className="player-row player-row-button" key={p._id} onClick={() => { setSelectedPlayer(p); setActivePage("players"); }}><Avatar player={p} /><div className="player-info"><strong>{fullName(p)}</strong><span>{p.sport} · Age {p.age}</span></div><span className="player-position">{p.status || "Active"}</span></button>)}</div>}</section>
    </>;
  }

  function renderPlayers() {
    if (selectedPlayer) return renderPlayerProfile();
    return <><PageHeading eyebrow="PLAYER MANAGEMENT" title="Players" description="Manage your academy's player directory and registrations." action={<button className="primary-button" onClick={openAddForm}>＋ Add New Player</button>} />{renderPlayerForm()}
      <section className="panel page-panel"><div className="section-heading"><div><h2>Player Directory</h2><p>Open a player to view their full profile</p></div><span>{players.length} Total Records</span></div>
        <div className="directory-controls"><input placeholder="Search by name, sport or position..." value={search} onChange={(e) => setSearch(e.target.value)} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>Active</option><option>Inactive</option><option>All</option></select></div>
        {loading ? <p>Loading players...</p> : loadError ? <div><p>{loadError}</p><button className="secondary-button" onClick={fetchPlayers}>Try again</button></div> : filteredPlayers.length === 0 ? <div className="empty-state"><h3>No matching players</h3><p>Try another filter or register a player.</p></div> : <div className="players-list">{filteredPlayers.map((p) => <div className="player-row directory-row" key={p._id}><button className="player-open" onClick={() => { setSelectedPlayer(p); setShowForm(false); }}><Avatar player={p} /><span className="player-info"><strong>{fullName(p)}</strong>{achievementTitles(p).length > 0 && <span className="player-achievement-titles">🏆 {achievementTitles(p).join(" · ")}</span>}<span>{p.sport} · Age {p.age}</span></span></button><span className={`status-pill ${(p.status || "Active") === "Active" ? "status-active" : "status-inactive"}`}>{p.status || "Active"}</span><div className="row-actions"><button className="secondary-button compact" onClick={() => openEditForm(p)}>Edit</button>{(p.status || "Active") === "Active" && <button className="danger-button compact" onClick={() => deactivatePlayer(p)}>Deactivate</button>}</div></div>)}</div>}
      </section></>;
  }

  async function handleMatchSubmit(event) {
    event.preventDefault(); setMatchSaving(true); setMatchFormError("");
    try {
      const response = await fetch(MATCH_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(matchForm) });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const bodyPreview = (await response.text()).slice(0, 120);
        throw new Error(`The match API returned a non-JSON response (HTTP ${response.status}). Check that server/server.js mounts /api/matches and that the backend is running on port 5000. Response: ${bodyPreview}`);
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not create match.");
      setMatches((current) => [result, ...current]);
      setMatchForm({ title: "", sport: selectedSport, date: "", venue: "", opponent: "", status: "Upcoming", result: "" });
      setShowMatchForm(false);
    } catch (error) { setMatchFormError(error.message); }
    finally { setMatchSaving(false); }
  }

  async function updateMatchStatus(match, status) {
    const resultText = status === "Completed" ? (window.prompt("Enter match result / score:", match.result || "") ?? null) : match.result;
    if (resultText === null) return;
    try {
      const response = await fetch(`${MATCH_API_URL}/${match._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, result: resultText }) });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || "Could not update match.");
      setMatches((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (error) { window.alert(error.message); }
  }

  function renderGames() {
    const sportPlayers = activePlayers.filter((player) => player.sport?.toLowerCase() === selectedSport.toLowerCase());
    const sportMatches = matches.filter((match) => match.sport?.toLowerCase() === selectedSport.toLowerCase());
    return <>
      <PageHeading eyebrow="SPORTS CENTRE" title={selectedSport} description={`Players, fixtures and results for ${selectedSport.toLowerCase()}.`} action={<button className="primary-button" onClick={() => { setMatchForm((current) => ({ ...current, sport: selectedSport })); setActivePage("matches"); setShowMatchForm(true); }}>＋ Add Match</button>} />
      <section className="panel sport-tabs-panel"><div className="sport-tabs">{SPORTS.filter((sport) => sport !== "Other").map((sport) => <button key={sport} className={`sport-tab ${selectedSport === sport ? "active" : ""}`} onClick={() => setSelectedSport(sport)}>{sport}</button>)}<button className={`sport-tab ${selectedSport === "Other" ? "active" : ""}`} onClick={() => setSelectedSport("Other")}>Other</button></div></section>
      <section className="stats-grid sport-stats"><article className="stat-card"><div className="stat-label">Active players</div><div className="stat-value">{sportPlayers.length}</div><div className="stat-change">Registered in {selectedSport}</div></article><article className="stat-card"><div className="stat-label">Upcoming matches</div><div className="stat-value">{sportMatches.filter((m) => m.status === "Upcoming").length}</div><div className="stat-change">Scheduled fixtures</div></article><article className="stat-card"><div className="stat-label">Completed matches</div><div className="stat-value">{sportMatches.filter((m) => m.status === "Completed").length}</div><div className="stat-change">Results recorded</div></article></section>
      <div className="games-content-grid"><section className="panel page-panel"><div className="section-heading"><div><h2>{selectedSport} Players</h2><p>Active athletes registered for this sport</p></div><button className="text-button" onClick={() => navigate("players")}>All players ↗</button></div>{sportPlayers.length ? <div className="players-list">{sportPlayers.map((player) => <button className="player-row player-row-button" key={player._id} onClick={() => { setSelectedPlayer(player); setActivePage("players"); }}><Avatar player={player}/><span className="player-info"><strong>{fullName(player)}</strong><span>{player.position || "Player"} · Age {player.age}</span></span><span className="player-position">View profile ↗</span></button>)}</div> : <div className="empty-state"><h3>No active {selectedSport.toLowerCase()} players yet</h3><p>Players assigned to {selectedSport} will appear here.</p><button className="secondary-button" onClick={() => { navigate("players"); openAddForm(); }}>＋ Register player</button></div>}</section>
      <section className="panel page-panel"><div className="section-heading"><div><h2>{selectedSport} Matches</h2><p>Upcoming fixtures and recorded results</p></div><button className="text-button" onClick={() => { setMatchForm((current) => ({ ...current, sport: selectedSport })); setActivePage("matches"); }}>View all ↗</button></div>{sportMatches.length ? <div className="match-list">{sportMatches.map((match) => <article className="match-item" key={match._id}><div className="match-item-top"><strong>{match.title}</strong><span className={`status-pill ${match.status === "Completed" ? "status-active" : ""}`}>{match.status}</span></div><p>{match.opponent ? `vs ${match.opponent} · ` : ""}{match.venue || "Venue TBC"}</p><small>{match.date ? new Date(`${match.date.slice(0,10)}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date TBC"}</small>{match.result && <p className="match-result">Result: {match.result}</p>}</article>)}</div> : <div className="empty-state"><p>No matches scheduled for this sport.</p><button className="secondary-button" onClick={() => { setMatchForm((current) => ({ ...current, sport: selectedSport })); setActivePage("matches"); setShowMatchForm(true); }}>＋ Schedule match</button></div>}</section></div>
    </>;
  }

  function renderMatches() {
    return <><PageHeading eyebrow="COMPETITIONS" title="Matches" description="Create fixtures, manage schedules and record results." action={<button className="primary-button" onClick={() => { setMatchForm({ title: "", sport: selectedSport, date: "", venue: "", opponent: "", status: "Upcoming", result: "" }); setShowMatchForm((value) => !value); }}>＋ Add Match</button>} />
      {showMatchForm && <section className="panel player-form-card"><div className="section-heading"><div><h2>Schedule a Match</h2><p>Enter the fixture details below</p></div><button className="secondary-button" onClick={() => setShowMatchForm(false)}>Close</button></div><form onSubmit={handleMatchSubmit}><div className="player-form-grid"><label>Match title *<input value={matchForm.title} onChange={(e) => setMatchForm({ ...matchForm, title: e.target.value })} placeholder="e.g. Academy League Match 1" required maxLength="120"/></label><label>Sport *<select value={matchForm.sport} onChange={(e) => setMatchForm({ ...matchForm, sport: e.target.value })}>{SPORTS.map((sport) => <option key={sport}>{sport}</option>)}</select></label><label>Date *<CalendarDatePicker value={matchForm.date} onChange={(date) => setMatchForm((current) => ({ ...current, date }))} placeholder="Choose match date" /></label><label>Venue<input value={matchForm.venue} onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })} maxLength="160" placeholder="Academy Ground"/></label><label>Opponent / team<input value={matchForm.opponent} onChange={(e) => setMatchForm({ ...matchForm, opponent: e.target.value })} maxLength="120" placeholder="Opponent name"/></label><label>Status<select value={matchForm.status} onChange={(e) => setMatchForm({ ...matchForm, status: e.target.value })}><option>Upcoming</option><option>Completed</option><option>Cancelled</option></select></label><label>Result / score<input value={matchForm.result} onChange={(e) => setMatchForm({ ...matchForm, result: e.target.value })} maxLength="160" placeholder="Optional until match is completed"/></label></div>{matchFormError && <p className="form-error">{matchFormError}</p>}<div className="player-form-actions"><button className="primary-button" disabled={matchSaving}>{matchSaving ? "Saving..." : "Save Match"}</button><button type="button" className="secondary-button" onClick={() => setShowMatchForm(false)}>Cancel</button></div></form></section>}
      <section className="panel page-panel"><div className="section-heading"><div><h2>All Matches</h2><p>{matches.length} recorded fixtures across all sports</p></div><button className="text-button" onClick={fetchMatches}>↻ Refresh</button></div>{matchesLoading ? <p>Loading matches...</p> : matchesError ? <p className="form-error">{matchesError}</p> : matches.length ? <div className="match-list">{matches.map((match) => <article className="match-item match-item-wide" key={match._id}><div className="match-item-top"><div><span className="eyebrow">{match.sport}</span><h3>{match.title}</h3></div><span className={`status-pill ${match.status === "Completed" ? "status-active" : match.status === "Cancelled" ? "status-inactive" : ""}`}>{match.status}</span></div><p>{match.opponent ? `vs ${match.opponent} · ` : ""}{match.venue || "Venue TBC"}</p><small>{match.date ? new Date(`${match.date.slice(0,10)}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Date TBC"}</small>{match.result && <p className="match-result">Result: {match.result}</p>}{match.status === "Upcoming" && <button className="secondary-button compact" onClick={() => updateMatchStatus(match, "Completed")}>Record result</button>}</article>)}</div> : <div className="empty-state"><h3>No matches yet</h3><p>Use Add Match to schedule your first fixture.</p></div>}</section>
    </>;
  }

  function renderSimplePage() {
    const configs = {
      attendance: ["ACADEMY OPERATIONS", "Attendance", "Monitor player attendance and training participation.", "Attendance tracking will be connected to the database in a later milestone."],
      trials: ["PLAYER DEVELOPMENT", "Trial Readiness", "Track player development and prepare athletes for upcoming trials.", "Player assessments and trial preparation will be developed in a later milestone."],
    };
    const [eyebrow, title, description, note] = configs[activePage];
    return <><PageHeading eyebrow={eyebrow} title={title} description={description} /><section className="panel page-panel"><div className="empty-state"><h2>{title} module</h2><p>{note}</p><span className="status-pill">Planned</span></div></section></>;
  }

  const title = pageTitles[activePage] || "Dashboard";
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-icon">S</div><div className="brand-copy"><h2>SPORTSYNC</h2><span>ACADEMY MANAGER</span></div></div><div className="menu-label">WORKSPACE</div><nav className="navigation">{NAV.map((item) => <button key={item.id} type="button" className={`nav-item ${activePage === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}><span>{item.icon}</span><b>{item.label}</b>{item.id === "players" && <span className="nav-count">{players.length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><strong>Need some help?</strong><p>Manage your academy with ease.</p><button onClick={() => window.alert("Help center will be available soon.")}>Visit Help Center ↗</button></div><div className="profile"><div className="avatar">AD</div><div className="profile-info"><strong>Academy Admin</strong><span>Administrator</span></div><span className="profile-menu">•••</span></div></div></aside>
    <main className="main-content"><header className="topbar"><div className="breadcrumb"><span>Workspace</span><i>/</i><strong>{selectedPlayer ? fullName(selectedPlayer) : title}</strong></div><div className="topbar-actions"><div className="today-label">◷ {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div><button className="icon-button" aria-label="Notifications" onClick={() => window.alert("You're all caught up!")}>♧<i /></button><div className="top-avatar">AD</div></div></header><div className="page-content">{activePage === "dashboard" ? renderDashboard() : activePage === "players" ? renderPlayers() : activePage === "games" ? renderGames() : activePage === "matches" ? renderMatches() : renderSimplePage()}<footer className="footer">© 2026 SportSync Academy<span>Built for better performance. <b>✦</b></span></footer></div></main></div>;
}

export default App;
