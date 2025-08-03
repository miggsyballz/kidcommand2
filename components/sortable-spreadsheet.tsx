"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical, Edit2, Save, X, Trash2, Plus } from "lucide-react"
import { parseDisplayValueForStorage, isDurationColumn } from "@/lib/duration-utils"

interface SpreadsheetEntry {
  id: string
  data: Record<string, any>
  position: number
  created_at: string
  playlist_id?: string | number
  [key: string]: any
}

interface SortableSpreadsheetProps {
  entries: SpreadsheetEntry[]
  columns: string[]
  onEntriesReorder: (entries: SpreadsheetEntry[]) => Promise<void>
  onColumnsReorder: (columns: string[]) => Promise<void>
  onCellEdit: (entryId: string, column: string, value: any) => Promise<void>
  onHeaderEdit: (oldColumn: string, newColumn: string) => Promise<void>
  onDeleteEntry: (entryId: string) => Promise<void>
  onAddColumn: () => Promise<void>
  getEntryValue: (entry: SpreadsheetEntry, column: string) => string
  formatValue?: (value: any, column: string) => string
  className?: string
  selectedEntries?: Set<number>
  onSelectEntry?: (entryId: number, checked: boolean) => void
  onSelectAll?: (checked: boolean) => void
}

export function SortableSpreadsheet({
  entries,
  columns,
  onEntriesReorder,
  onColumnsReorder,
  onCellEdit,
  onHeaderEdit,
  onDeleteEntry,
  onAddColumn,
  getEntryValue,
  className = "",
  selectedEntries,
  onSelectEntry,
  onSelectAll,
}: SortableSpreadsheetProps) {
  const [draggedEntry, setDraggedEntry] = useState<string | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<{ entryId: string; column: string } | null>(null)
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [dragOverEntry, setDragOverEntry] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const dragCounter = useRef(0)

  // Entry drag handlers
  const handleEntryDragStart = useCallback((e: React.DragEvent, entryId: string) => {
    setDraggedEntry(entryId)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", entryId)
  }, [])

  const handleEntryDragOver = useCallback(
    (e: React.DragEvent, entryId: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (draggedEntry && draggedEntry !== entryId) {
        setDragOverEntry(entryId)
      }
    },
    [draggedEntry],
  )

  const handleEntryDragLeave = useCallback((e: React.DragEvent) => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverEntry(null)
    }
  }, [])

  const handleEntryDragEnter = useCallback((e: React.DragEvent) => {
    dragCounter.current++
  }, [])

  const handleEntryDrop = useCallback(
    (e: React.DragEvent, targetEntryId: string) => {
      e.preventDefault()
      dragCounter.current = 0

      if (!draggedEntry || draggedEntry === targetEntryId) {
        setDraggedEntry(null)
        setDragOverEntry(null)
        setIsDragging(false)
        return
      }

      const draggedIndex = entries.findIndex((entry) => entry.id === draggedEntry)
      const targetIndex = entries.findIndex((entry) => entry.id === targetEntryId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedEntry(null)
        setDragOverEntry(null)
        setIsDragging(false)
        return
      }

      const newEntries = [...entries]
      const [draggedItem] = newEntries.splice(draggedIndex, 1)
      newEntries.splice(targetIndex, 0, draggedItem)

      // Update positions
      const updatedEntries = newEntries.map((entry, index) => ({
        ...entry,
        position: index + 1,
      }))

      onEntriesReorder(updatedEntries)
      setDraggedEntry(null)
      setDragOverEntry(null)
      setIsDragging(false)
    },
    [draggedEntry, entries, onEntriesReorder],
  )

  const handleEntryDragEnd = useCallback(() => {
    setDraggedEntry(null)
    setDragOverEntry(null)
    setIsDragging(false)
    dragCounter.current = 0
  }, [])

  // Column drag handlers
  const handleColumnDragStart = useCallback((e: React.DragEvent, column: string) => {
    setDraggedColumn(column)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", column)
  }, [])

  const handleColumnDragOver = useCallback(
    (e: React.DragEvent, column: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (draggedColumn && draggedColumn !== column) {
        setDragOverColumn(column)
      }
    },
    [draggedColumn],
  )

  const handleColumnDrop = useCallback(
    (e: React.DragEvent, targetColumn: string) => {
      e.preventDefault()

      if (!draggedColumn || draggedColumn === targetColumn) {
        setDraggedColumn(null)
        setDragOverColumn(null)
        return
      }

      const draggedIndex = columns.findIndex((col) => col === draggedColumn)
      const targetIndex = columns.findIndex((col) => col === targetColumn)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedColumn(null)
        setDragOverColumn(null)
        return
      }

      const newColumns = [...columns]
      const [draggedItem] = newColumns.splice(draggedIndex, 1)
      newColumns.splice(targetIndex, 0, draggedItem)

      onColumnsReorder(newColumns)
      setDraggedColumn(null)
      setDragOverColumn(null)
    },
    [draggedColumn, columns, onColumnsReorder],
  )

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }, [])

  // Edit handlers
  const handleCellClick = (entryId: string, column: string) => {
    if (isDragging) return

    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      setEditingCell({ entryId, column })
      const currentValue = getEntryValue(entry, column)
      setEditValue(currentValue === "-" ? "" : currentValue)
    }
  }

  const handleHeaderClick = (column: string) => {
    setEditingHeader(column)
    setEditValue(column)
  }

  const saveCellEdit = async () => {
    if (!editingCell) return

    try {
      // Convert display value back to storage format
      const processedValue = parseDisplayValueForStorage(editValue, editingCell.column)

      await onCellEdit(editingCell.entryId, editingCell.column, processedValue)

      setEditingCell(null)
      setEditValue("")
    } catch (err) {
      console.error("Error updating cell:", err)
    }
  }

  const saveHeaderEdit = async () => {
    if (!editingHeader || !editValue.trim()) return

    try {
      await onHeaderEdit(editingHeader, editValue.trim())

      setEditingHeader(null)
      setEditValue("")
    } catch (err) {
      console.error("Error updating header:", err)
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditingHeader(null)
    setEditValue("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Add Column Button */}
      <div className="flex justify-end">
        <Button onClick={onAddColumn} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>

      {/* Spreadsheet Table */}
      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="h-12 w-12 mx-auto mb-4 opacity-50 rounded-full bg-muted flex items-center justify-center">
            <GripVertical className="h-6 w-6" />
          </div>
          <p>No entries found.</p>
          <p className="text-sm">Add some data to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                {onSelectEntry && (
                  <th className="text-left py-1 px-2 font-medium text-xs w-12">
                    <Checkbox
                      checked={selectedEntries?.size === entries.length && entries.length > 0}
                      onCheckedChange={onSelectAll}
                    />
                  </th>
                )}
                <th className="text-left py-1 px-2 font-medium text-xs w-16">#</th>
                {columns.map((column) => (
                  <th
                    key={column}
                    className={`text-left py-1 px-2 font-medium text-xs min-w-[100px] max-w-[150px] ${
                      dragOverColumn === column ? "bg-blue-100 dark:bg-blue-900/20" : ""
                    } ${draggedColumn === column ? "opacity-50" : ""}`}
                  >
                    {editingHeader === column ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 text-xs"
                          onKeyPress={(e) => e.key === "Enter" && saveHeaderEdit()}
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveHeaderEdit}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group">
                        <button
                          className="cursor-grab hover:bg-muted rounded p-1"
                          draggable
                          onDragStart={(e) => handleColumnDragStart(e, column)}
                          onDragOver={(e) => handleColumnDragOver(e, column)}
                          onDrop={(e) => handleColumnDrop(e, column)}
                          onDragEnd={handleColumnDragEnd}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <span className="truncate" title={column}>
                          {column}
                          {isDurationColumn(column) && <span className="text-muted-foreground ml-1">(mm:ss)</span>}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100"
                          onClick={() => handleHeaderClick(column)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </th>
                ))}
                <th className="text-left py-1 px-2 font-medium text-xs w-20">Created</th>
                <th className="text-left py-1 px-2 font-medium text-xs w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`border-b hover:bg-muted/50 ${
                    dragOverEntry === entry.id ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500" : ""
                  } ${draggedEntry === entry.id ? "opacity-50" : ""} ${
                    selectedEntries?.has(Number(entry.id)) ? "bg-blue-50" : ""
                  }`}
                >
                  {onSelectEntry && (
                    <td className="py-1 px-2 w-12">
                      <Checkbox
                        checked={selectedEntries?.has(Number(entry.id)) || false}
                        onCheckedChange={(checked) => onSelectEntry(Number(entry.id), checked as boolean)}
                      />
                    </td>
                  )}
                  <td className="py-1 px-2 text-xs text-muted-foreground w-16">
                    <div className="flex items-center gap-1">
                      <button
                        className="cursor-grab hover:bg-muted rounded p-1"
                        draggable
                        onDragStart={(e) => handleEntryDragStart(e, entry.id)}
                        onDragOver={(e) => handleEntryDragOver(e, entry.id)}
                        onDragEnter={handleEntryDragEnter}
                        onDragLeave={handleEntryDragLeave}
                        onDrop={(e) => handleEntryDrop(e, entry.id)}
                        onDragEnd={handleEntryDragEnd}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                      </button>
                      {index + 1}
                    </div>
                  </td>
                  {columns.map((column) => {
                    const value = getEntryValue(entry, column)
                    const isEditing = editingCell?.entryId === entry.id && editingCell?.column === column

                    return (
                      <td key={column} className="py-1 px-2 max-w-[150px]">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-6 text-xs"
                              onKeyPress={(e) => e.key === "Enter" && saveCellEdit()}
                              placeholder={isDurationColumn(column) ? "MM:SS" : ""}
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveCellEdit}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="text-xs cursor-pointer hover:bg-muted/50 py-1 px-1 rounded group truncate"
                            onClick={() => handleCellClick(entry.id, column)}
                            title={`${column}: ${value}${
                              isDurationColumn(column) ? " (Click to edit - use MM:SS format)" : ""
                            }`}
                          >
                            <span className={value === "-" ? "text-muted-foreground" : ""}>{value}</span>
                            <Edit2 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 inline" />
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="py-1 px-2 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-1 px-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={() => onDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
