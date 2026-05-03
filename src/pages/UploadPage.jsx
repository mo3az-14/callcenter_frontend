import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import FileDropzone from '../components/FileDropzone.jsx'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .up-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #080A0F;
    display: flex;
    flex-direction: column;
    color: #F1F5F9;
  }

  .up-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 60px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    background: rgba(8,10,15,0.96);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .up-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 17px;
    color: #F1F5F9;
    letter-spacing: -0.02em;
  }

  .up-back-link {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.35);
    text-decoration: none;
    padding: 5px 12px;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 6px;
    transition: all 0.2s;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .up-back-link:hover {
    color: rgba(255,255,255,0.65);
    border-color: rgba(255,255,255,0.18);
  }

  .up-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px 64px;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    gap: 32px;
  }

  .up-header {
    width: 100%;
    text-align: center;
    animation: fadeUp 0.4s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .up-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 26px;
    color: #F1F5F9;
    letter-spacing: -0.03em;
    margin: 0 0 8px;
  }

  .up-subtitle {
    font-size: 13px;
    font-weight: 300;
    color: rgba(255,255,255,0.3);
    margin: 0;
    letter-spacing: 0.01em;
  }

  .up-dropzone-wrap {
    width: 100%;
    animation: fadeUp 0.4s 0.1s ease both;
  }

  /* Success card */
  .up-success {
    width: 100%;
    padding: 16px 20px;
    background: rgba(45,212,191,0.04);
    border: 1px solid rgba(45,212,191,0.12);
    border-left: 3px solid #2DD4BF;
    border-radius: 10px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    animation: fadeUp 0.3s ease forwards;
  }

  .up-success-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(45,212,191,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .up-success-body {
    flex: 1;
    min-width: 0;
  }

  .up-success-name {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }

  .up-success-meta {
    font-size: 12px;
    font-weight: 300;
    color: rgba(255,255,255,0.3);
  }

  .up-success-label {
    font-size: 11px;
    font-weight: 600;
    color: #2DD4BF;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  /* Error */
  .up-error {
    width: 100%;
    padding: 12px 16px;
    background: rgba(248,113,113,0.06);
    border: 1px solid rgba(248,113,113,0.14);
    border-radius: 8px;
    font-size: 13px;
    color: #FCA5A5;
    animation: fadeUp 0.25s ease forwards;
  }
`

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function UploadPage() {
  const { userId } = useAuth()
  const [lastFile, setLastFile] = useState(null)
  const [error, setError] = useState('')

  function handleSuccess(fileRecord) {
    setError('')
    setLastFile(fileRecord)
  }

  function handleError(msg) {
    setLastFile(null)
    setError(msg)
  }

  function handleUploadStart() {
    setLastFile(null)
    setError('')
  }

  return (
    <>
      <style>{css}</style>
      <div className="up-root">
        <header className="up-topbar">
          <div className="up-brand">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="10" stroke="#2DD4BF" strokeWidth="1.5" opacity="0.35" />
              <path d="M4.5 11 Q8 5.5 11 11 Q14 16.5 17.5 11" stroke="#2DD4BF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
            CallCenter
          </div>
          <Link to="/call" className="up-back-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to call
          </Link>
        </header>

        <main className="up-body">
          <div className="up-header">
            <h1 className="up-title">Document Upload</h1>
            <p className="up-subtitle">Upload knowledge base files for the AI agent</p>
          </div>

          <div className="up-dropzone-wrap">
            <FileDropzone
              userId={userId}
              onSuccess={handleSuccess}
              onError={handleError}
              onUploadStart={handleUploadStart}
            />
          </div>

          {lastFile && (
            <div className="up-success" role="status">
              <div className="up-success-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="up-success-body">
                <p className="up-success-label">Uploaded</p>
                <p className="up-success-name">{lastFile.file_name}</p>
                <p className="up-success-meta">{formatDate(lastFile.created_at)}</p>
              </div>
            </div>
          )}

          {error && (
            <p className="up-error" role="alert">{error}</p>
          )}
        </main>
      </div>
    </>
  )
}
