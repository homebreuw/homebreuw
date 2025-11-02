import { createRoot } from 'react-dom/client'
import { getCurrentWindow } from '@tauri-apps/api/window';
import "xp.css/dist/XP.css"
import './index.css'

import App from './App.tsx'
import { useState } from 'react';

createRoot(document.getElementById('root')!).render(<IndexApp />)

function IndexApp() {
  const [maximized, setMaximized] = useState(false);

  return (
    <>
      <div className="title-bar" data-tauri-drag-region>
        <div className="title-bar-text">Home Breuw</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={() => {getCurrentWindow().minimize()}}></button>
          <button aria-label={maximized ? "Restore" : "Maximize"} onClick={async () => {await getCurrentWindow().toggleMaximize(); setMaximized(await getCurrentWindow().isMaximized())}}></button>
          <button aria-label="Close" onClick={() => {getCurrentWindow().close()}}></button>
        </div>
      </div>
      <App />
    </>
  )
}