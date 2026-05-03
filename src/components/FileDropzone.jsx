import { useState, useRef } from 'react'
import { uploadFile } from '../api/files.js'

const css = `
  .fdz-root {
    font-family: 'DM Sans', sans-serif;
    width: 100%;
  }

  .fdz-zone {
    position: relative;
    border: 1.5px dashed rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 48px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    background: rgba(255,255,255,0.02);
    min-height: 220px;
    text-align: center;
  }

  .fdz-zone:hover {
    border-color: rgba(45,212,191,0.3);
    background: rgba(45,212,191,0.02);
  }

  .fdz-zone.dragging {
    border-color: #2DD4BF;
    background: rgba(45,212,191,0.04);
    box-shadow: 0 0 0 4px rgba(45,212,191,0.06), inset 0 0 40px rgba(45,212,191,0.03);
  }

  .fdz-zone.uploading {
    cursor: default;
    pointer-events: none;
  }

  .fdz-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .fdz-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(45,212,191,0.08);
    border: 1px solid rgba(45,212,191,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .fdz-zone.dragging .fdz-icon {
    background: rgba(45,212,191,0.14);
  }

  .fdz-label {
    font-size: 14px;
    font-weight: 400;
    color: rgba(255,255,255,0.55);
    line-height: 1.5;
  }

  .fdz-label strong {
    color: #2DD4BF;
    font-weight: 500;
  }

  .fdz-sub {
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    font-weight: 300;
  }

  .fdz-types {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .fdz-type-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(45,212,191,0.6);
    background: rgba(45,212,191,0.07);
    border: 1px solid rgba(45,212,191,0.15);
    border-radius: 4px;
    padding: 3px 8px;
    text-transform: uppercase;
  }

  /* Progress state */
  .fdz-progress-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .fdz-filename {
    font-size: 13px;
    font-weight: 400;
    color: rgba(255,255,255,0.6);
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fdz-progress-track {
    width: 100%;
    max-width: 320px;
    height: 3px;
    background: rgba(255,255,255,0.07);
    border-radius: 3px;
    overflow: hidden;
  }

  .fdz-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #2DD4BF, #0EA5E9);
    border-radius: 3px;
    transition: width 0.12s ease;
  }

  .fdz-progress-pct {
    font-size: 12px;
    font-weight: 500;
    color: rgba(45,212,191,0.7);
    font-variant-numeric: tabular-nums;
  }
`

const ACCEPTED_TYPES = ['PDF', 'DOCX', 'XLSX', 'CSV']

export default function FileDropzone({ userId, onSuccess, onError, onUploadStart }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  function handleInput(e) {
    const file = e.target.files[0]
    if (file) upload(file)
    e.target.value = ''
  }

  async function upload(file) {
    onUploadStart?.()
    setUploading(true)
    setProgress(0)
    setFileName(file.name)
    try {
      const data = await uploadFile(userId, file, pct => setProgress(pct))
      onSuccess(data)
    } catch (err) {
      onError(
        err.response?.status === 422
          ? 'Unsupported file type or content-type mismatch'
          : 'Upload failed. Please try again.'
      )
    } finally {
      setUploading(false)
      setProgress(0)
      setFileName('')
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="fdz-root">
        <div
          className={`fdz-zone${dragging ? ' dragging' : ''}${uploading ? ' uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="File upload drop zone"
          onKeyDown={e => e.key === 'Enter' && !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.xlsx,.csv"
            onChange={handleInput}
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
          />

          {uploading ? (
            <div className="fdz-progress-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" style={{animation: 'spin 1.2s linear infinite', transformOrigin: 'center'}} />
              </svg>
              <p className="fdz-filename">{fileName}</p>
              <div className="fdz-progress-track">
                <div className="fdz-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="fdz-progress-pct">{progress}%</span>
            </div>
          ) : (
            <>
              <div className="fdz-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M11 14V4M7 8l4-4 4 4" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 15v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="rgba(45,212,191,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="fdz-label">
                <strong>Drop file here</strong> or click to browse
              </p>
              <p className="fdz-sub">One file at a time · Max supported by server</p>
              <div className="fdz-types">
                {ACCEPTED_TYPES.map(t => (
                  <span key={t} className="fdz-type-badge">{t}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
