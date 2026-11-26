import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./AdminTags.css";

type ContentTag = { id: string; label: string; slug: string; description: string; active: number; sort_order: number; created_at: string; updated_at: string };
const blank = { label: "", description: "", sort_order: "100" };
async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, credentials: "same-origin", cache: "no-store", headers: { "content-type": "application/json", ...(init?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}
export default function AdminTags() {
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try { const data = await request("/api/admin/content-tags"); setTags(data.tags || []); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Tags could not be loaded."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) };
      await request(editing ? "/api/admin/content-tags/" + encodeURIComponent(editing) : "/api/admin/content-tags", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setNotice(editing ? "Tag updated." : "New tag added."); setForm(blank); setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Tag could not be saved."); }
    finally { setBusy(false); }
  };
  const edit = (tag: ContentTag) => { setEditing(tag.id); setForm({ label: tag.label, description: tag.description || "", sort_order: String(tag.sort_order) }); setNotice(""); setError(""); };
  const toggle = async (tag: ContentTag) => {
    setBusy(true); setError(""); setNotice("");
    try { await request("/api/admin/content-tags/" + encodeURIComponent(tag.id), { method: "PATCH", body: JSON.stringify({ active: !tag.active }) }); setNotice(tag.active ? "Tag hidden from member-facing discovery." : "Tag is active again."); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Tag status could not be changed."); }
    finally { setBusy(false); }
  };
  const remove = async (tag: ContentTag) => {
    if (!window.confirm("Delete the tag “" + tag.label + "”? This removes it from the tag catalogue.")) return;
    setBusy(true); setError(""); setNotice("");
    try { await request("/api/admin/content-tags/" + encodeURIComponent(tag.id), { method: "DELETE" }); setNotice("Tag deleted."); if (editing === tag.id) { setEditing(null); setForm(blank); } await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Tag could not be deleted."); }
    finally { setBusy(false); }
  };
  return <section className="admin-tags">
    <div className="admin-detail-head"><div><small>CONTENT ORGANISATION</small><h2>Tag management</h2><p>Create and maintain reusable football tags for organising content and member discovery. Keep labels short and easy to scan.</p></div><button className="admin-refresh" onClick={() => void load()}>↻ REFRESH</button></div>
    {error && <div className="admin-error">{error}</div>}{notice && <div className="admin-success">{notice}</div>}
    <div className="admin-tags-summary"><article><small>TOTAL TAGS</small><strong>{tags.length}</strong></article><article><small>ACTIVE</small><strong>{tags.filter(t => t.active).length}</strong></article><article><small>HIDDEN</small><strong>{tags.filter(t => !t.active).length}</strong></article></div>
    <form className="admin-tags-form" onSubmit={save}>
      <div className="admin-tags-form-heading"><span className="eyebrow">{editing ? "EDIT EXISTING TAG" : "TAG CATALOGUE"}</span><h3>{editing ? "Update tag details" : "Add a new tag"}</h3><p>Examples: Premier League, Champions League, Transfers, VAR, Tactical Analysis.</p></div>
      <div className="admin-form-grid">
        <label>TAG NAME<input required minLength={2} maxLength={40} value={form.label} onChange={e => setForm(v => ({ ...v, label: e.target.value }))} placeholder="e.g. Transfer News" /></label>
        <label>DISPLAY ORDER<input type="number" min="0" max="9999" value={form.sort_order} onChange={e => setForm(v => ({ ...v, sort_order: e.target.value }))} /></label>
        <label className="admin-tags-wide">DESCRIPTION (OPTIONAL)<textarea maxLength={180} value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} placeholder="A short explanation of what belongs under this tag." /></label>
      </div>
      <div className="admin-tags-actions"><button className="admin-primary" disabled={busy}>{busy ? "SAVING…" : editing ? "SAVE TAG CHANGES" : "ADD TAG"}</button>{editing && <button type="button" className="admin-refresh" disabled={busy} onClick={() => { setEditing(null); setForm(blank); }}>CANCEL EDIT</button>}</div>
    </form>
    <div className="admin-section-title">MANAGED TAGS <span>{tags.length} TOTAL</span></div>
    {tags.length === 0 ? <div className="admin-empty"><span>◇</span><h3>No tags created yet</h3><p>Add your first tag above. It will appear here for management.</p></div> : <div className="admin-tags-list">{tags.map(tag => <article key={tag.id}>
      <div className="admin-tags-chip">{tag.label}</div><div className="admin-tags-copy"><b>{tag.label}</b><small>/{tag.slug} · ORDER {tag.sort_order}</small>{tag.description && <p>{tag.description}</p>}</div>
      <span className={tag.active ? "admin-tags-status active" : "admin-tags-status"}>{tag.active ? "ACTIVE" : "HIDDEN"}</span>
      <div className="admin-tags-row-actions"><button disabled={busy} onClick={() => edit(tag)}>EDIT</button><button disabled={busy} onClick={() => void toggle(tag)}>{tag.active ? "HIDE" : "ACTIVATE"}</button><button className="danger" disabled={busy} onClick={() => void remove(tag)}>DELETE</button></div>
    </article>)}</div>}
  </section>;
}
