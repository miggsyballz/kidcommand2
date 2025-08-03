import type React from "react"
import Link from "next/link"

const AppSidebar: React.FC = () => {
  return (
    <div className="bg-gray-800 text-white w-64 h-screen">
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2">
          <img src="/music-matrix-logo.png" alt="Music Matrix Logo" className="h-20 w-auto" />
        </div>
      </div>
      <nav className="mt-4">
        <ul className="space-y-2">
          <li>
            <Link href="/">
              <a className="flex items-center px-4 py-2 hover:bg-gray-700 rounded">
                <span className="ml-3">Home</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/library">
              <a className="flex items-center px-4 py-2 hover:bg-gray-700 rounded">
                <span className="ml-3">Library</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/settings">
              <a className="flex items-center px-4 py-2 hover:bg-gray-700 rounded">
                <span className="ml-3">Settings</span>
              </a>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default AppSidebar
