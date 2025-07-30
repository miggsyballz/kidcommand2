import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

const columns = [
  "Catergory", "UID", "Title", "Artist", "Keywords", "Runs",
  "Performnce", "Era", "Mood", "Energy", "Role", "Sound", "Tempo", "Type"
]

export function PlaylistViewContent() {
  const [playlistId, setPlaylistId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    fetchPlaylists()
  }, [])

  useEffect(() => {
    if (playlistId) fetchEntries()
  }, [playlistId])

  async function fetchPlaylists() {
    const { data, error } = await supabase.from("playlists").select("*")
    if (!error) setPlaylists(data)
  }

  async function fetchEntries() {
    const { data, error } = await supabase
      .from("playlist_entries")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("created_at", { ascending: true })
    if (!error) setEntries(data || [])
  }

  async function updateEntry(id: string, field: string, value: any) {
    const { error } = await supabase
      .from("playlist_entries")
      .update({ [field]: value })
      .eq("id", id)
    if (error) console.error("Update failed", error)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, row: any, field: string) {
    const updated = entries.map(r =>
      r.id === row.id ? { ...r, [field]: e.target.value } : r
    )
    setEntries(updated)
    updateEntry(row.id, field, e.target.value)
  }

  function exportToExcel() {
    const exportData = entries.map(row => {
      const obj: any = {}
      columns.forEach(col => {
        obj[col] = row[col] ?? ""
      })
      return obj
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Playlist")
    XLSX.writeFile(wb, "ExportedPlaylist.xlsx")
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <label>Select Playlist: </label>
        <select
          className="border px-2 py-1"
          onChange={(e) => setPlaylistId(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {playlists.map((pl) => (
            <option key={pl.id} value={pl.id}>{pl.name}</option>
          ))}
        </select>
        <button onClick={exportToExcel} className="ml-4 bg-blue-500 text-white px-3 py-1 rounded">
          Export to Excel
        </button>
      </div>

      <div className="overflow-auto max-h-[70vh] border rounded">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col} className="border px-2 py-1 text-left text-xs">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="border px-2 py-1">
                    <input
                      className="w-full bg-transparent outline-none text-sm"
                      value={row[col] || ""}
                      onChange={(e) => handleChange(e, row, col)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
