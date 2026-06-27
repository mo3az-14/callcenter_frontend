import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { uploadFile } from '../api/files.js'
import { Brand } from '../components/Orb.jsx'
import { PlusIcon, FileIcon } from '../components/Icons.jsx'

function sizeStr(b) {
  if (b < 1024) return b + ' b'
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' kb'
  return (b / (1024 * 1024)).toFixed(1) + ' mb'
}

function whenStr(t) {
  const d = (Date.now() - t) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return Math.floor(d / 60) + 'm ago'
  if (d < 86400) return Math.floor(d / 3600) + 'h ago'
  return new Date(t).toLocaleDateString()
}

const ACCEPT = /\.(pdf|docx|xlsx|csv)$/i

export default function UploadPage() {
  const { userId, email, logout } = useAuth()
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [recent, setRecent] = useState(null)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFiles(incoming) {
    setError(null)
    for (const f of incoming) {
      if (!ACCEPT.test(f.name)) {
        setError(`${f.name} isn't a supported file type.`)
        continue
      }
      setUploading(true)
      try {
        const result = await uploadFile(userId, f)
        const entry = {
          id: result.file_id,
          name: result.file_name,
          size: f.size,
          at: new Date(result.created_at).getTime(),
        }
        setFiles(s => [entry, ...s])
        setRecent(entry)
      } catch (err) {
        setError(err.response?.status === 422 ? 'Unsupported file type.' : 'Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    }
  }

  useEffect(() => {
    const onDragOver = (e) => { e.preventDefault(); setDragOver(true) }
    const onDragLeave = (e) => { if (e.target === document.documentElement) setDragOver(false) }
    const onDrop = (e) => {
      e.preventDefault(); setDragOver(false)
      handleFiles([...(e.dataTransfer?.files || [])])
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [userId])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="page">
      <div className="topbar">
        <Brand size={13}/>
        <div className="row gap-m" style={{ alignItems: 'center' }}>
          <span className="chip" style={{ color: 'var(--c)', borderColor: 'rgba(94,234,212,0.3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--c)' }}/>
            admin
          </span>
          {email && <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{email}</span>}
          <button className="btn ghost sm" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="grow" style={{
        display: 'flex', padding: '48px 56px', gap: 56,
        position: 'relative', maxWidth: 1100, width: '100%', margin: '0 auto',
      }}>
        {/* Left: hero + drop CTA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 480 }}>
          <div>
            <span className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-3)' }}>
              · knowledge base
            </span>
            <div className="display" style={{ fontSize: 52, lineHeight: 1, marginTop: 12 }}>
              Feed the<br/>
              <span style={{ fontStyle: 'italic', color: 'var(--c)' }}>agents.</span>
            </div>
            <div style={{ color: 'var(--fg-3)', marginTop: 14, fontSize: 15, maxWidth: 380 }}>
              Drop a document anywhere on this page. It'll be indexed and ready to reference in seconds.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              className="btn primary lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <PlusIcon/>&nbsp;{uploading ? 'Uploading…' : 'Choose a file'}
            </button>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>or drag &amp; drop</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.csv"
            style={{ display: 'none' }}
            onChange={e => handleFiles([...(e.target.files || [])])}
          />

          <div className="mono" style={{
            fontSize: 11, color: 'var(--fg-4)', textTransform: 'uppercase',
            letterSpacing: '0.08em', paddingTop: 8, borderTop: '1px dashed var(--line)',
          }}>
            accepts pdf · docx · xlsx · csv · up to 10mb each
          </div>

          {error && (
            <div className="fade-up" style={{
              padding: '10px 14px', background: 'rgba(239,83,80,0.08)',
              border: '1px solid rgba(239,83,80,0.3)', borderRadius: 10,
              color: 'var(--danger)', fontSize: 13.5,
            }}>
              {error}
            </div>
          )}

          {recent && (
            <div className="fade-up" style={{
              padding: '12px 16px', background: 'var(--c-tint)',
              border: '1px solid rgba(94,234,212,0.25)', borderRadius: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 14 }}>{recent.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2 }}>
                  indexed · {whenStr(recent.at)} · {sizeStr(recent.size)}
                </div>
              </div>
              <span className="chip" style={{ color: 'var(--c)', borderColor: 'rgba(94,234,212,0.3)' }}>ok</span>
            </div>
          )}
        </div>

        {/* Right: library */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-3)' }}>
              library &nbsp;·&nbsp; {files.length} files
            </div>
            {files.length > 0 && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
                {sizeStr(files.reduce((a, f) => a + (f.size || 0), 0))} total
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line)' }}>
            {files.length === 0 && (
              <div className="mono" style={{ fontSize: 12, color: 'var(--fg-5)', padding: '24px 0', textAlign: 'center' }}>
                no files yet
              </div>
            )}
            {files.map((f, i) => (
              <div key={f.id ?? i} className="row" style={{
                padding: '14px 0',
                borderBottom: '1px solid var(--line)',
                justifyContent: 'space-between', alignItems: 'center',
                animation: i === 0 && recent?.name === f.name ? 'fadeUp 360ms cubic-bezier(.2,.7,.3,1)' : 'none',
              }}>
                <div className="row gap-m" style={{ alignItems: 'center', minWidth: 0 }}>
                  <FileIcon name={f.name}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.name}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {whenStr(f.at)}
                    </div>
                  </div>
                </div>
                <div className="row gap-m" style={{ alignItems: 'center' }}>
                  {f.size != null && <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{sizeStr(f.size)}</span>}
                  <button
                    onClick={() => setFiles(s => s.filter((_, j) => j !== i))}
                    style={{
                      appearance: 'none', background: 'transparent', border: 0,
                      cursor: 'pointer', color: 'var(--fg-4)', padding: 4, opacity: 0.5,
                      transition: 'opacity 120ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                    aria-label="Remove file"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {dragOver && (
        <div className="fade-in" style={{
          position: 'fixed', inset: 16, zIndex: 50,
          border: '2px dashed var(--c)', borderRadius: 22,
          background: 'rgba(94,234,212,0.08)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 18, pointerEvents: 'none',
        }}>
          <PlusIcon size={36}/>
          <div className="display" style={{ fontSize: 36, color: 'var(--c)' }}>
            Drop to feed the agents.
          </div>
        </div>
      )}
    </div>
  )
}
