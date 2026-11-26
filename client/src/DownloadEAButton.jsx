import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function DownloadEAButton() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true
    fetch(`${API_URL}/api/download/ea/status`)
      .then((response) => response.json())
      .then((data) => { if (active) setStatus(data.available ? 'ready' : 'missing') })
      .catch(() => { if (active) setStatus('missing') })
    return () => { active = false }
  }, [])

  if (status === 'ready') {
    return <a className="purchase-button download-ea-button" href={`${API_URL}/api/download/ea`}>DOWNLOAD EA FREE</a>
  }

  return <button className="purchase-button download-ea-button" type="button" disabled title="The admin must upload the EA file before it can be downloaded">{status === 'checking' ? 'CHECKING EA DOWNLOAD…' : 'EA DOWNLOAD COMING SOON'}</button>
}
