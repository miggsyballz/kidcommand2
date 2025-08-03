"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical, Trash2, Plus, Check, X } from "lucide-react"

interface Entry {
  id: string
  data: Record<string, any>
  position: number
  created_at: string
  playlist_id?: number
}

interface SortableSpreadsheetProps {
  entries: Entry[]
  columns: string[]
  onEntriesReorder: (entries: Entry[]) => void
  onColumnsReorder: (columns: string[]) => void
  onCellEdit: (entryId: string, column: string, value: any) => Promise<void>
  onHeaderEdit: (oldColumn: string, newColumn: string) => Promise<void>
  onDeleteEntry: (entryId: string) => Promise<void>
  onAddColumn: () => void
  getEntryValue: (entry: Entry, column: string) => string
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

  const dragCounter = useRef(0)

  // Entry drag handlers
  const handleEntryDragStart = useCallback((e: React.DragEvent, entryId: string) => {
    setDraggedEntry(entryId)
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
        return
      }

      const draggedIndex = entries.findIndex((entry) => entry.id === draggedEntry)
      const targetIndex = entries.findIndex((entry) => entry.id === targetEntryId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedEntry(null)
        setDragOverEntry(null)
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
    },
    [draggedEntry, entries, onEntriesReorder],
  )

  const handleEntryDragEnd = useCallback(() => {
    setDraggedEntry(null)
    setDragOverEntry(null)
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
  const handleCellDoubleClick = (entryId: string, column: string) => {
    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      setEditingCell({ entryId, column })
      setEditValue(getEntryValue(entry, column))
    }
  }

  const handleCellEditSave = async () => {
    if (!editingCell) return

    try {
      await onCellEdit(editingCell.entryId, editingCell.column, editValue)
      setEditingCell(null)
      setEditValue("")
    } catch (error) {
      console.error("Error saving cell edit:", error)
    }
  }

  const handleCellEditCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleHeaderDoubleClick = (column: string) => {
    setEditingHeader(column)
    setEditValue(column)
  }

  const handleHeaderEditSave = async () => {
    if (!editingHeader || !editValue.trim()) return

    try {
      await onHeaderEdit(editingHeader, editValue.trim())
      setEditingHeader(null)
      setEditValue("")
    } catch (error) {
      console.error("Error saving header edit:", error)
    }
  }

  const handleHeaderEditCancel = () => {
    setEditingHeader(null)
    setEditValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (editingCell) {
        handleCellEditSave()
      } else if (editingHeader) {
        handleHeaderEditSave()
      }
    } else if (e.key === "Escape") {
      if (editingCell) {
        handleCellEditCancel()
      } else if (editingHeader) {
        handleHeaderEditCancel()
      }
    }
  }

  return (
    <div className="w-full h-full overflow-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Selection column */}
            {selectedEntries !== undefined && onSelectEntry && onSelectAll && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEntries.size === entries.length && entries.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}

            {/* Drag handle column */}
            <TableHead className="w-12"></TableHead>

            {/* Data columns */}
            {columns.map((column) => (
              <TableHead
                key={column}
                className={`cursor-pointer select-none ${
                  dragOverColumn === column ? "bg-blue-100 dark:bg-blue-900/20" : ""
                } ${draggedColumn === column ? "opacity-50" : ""}`}
                draggable
                onDragStart={(e) => handleColumnDragStart(e, column)}
                onDragOver={(e) => handleColumnDragOver(e, column)}
                onDrop={(e) => handleColumnDrop(e, column)}
                onDragEnd={handleColumnDragEnd}
                onDoubleClick={() => handleHeaderDoubleClick(column)}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  {editingHeader === column ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="h-6 text-xs"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={handleHeaderEditSave} className="h-6 w-6 p-0">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleHeaderEditCancel} className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="truncate">{column}</span>
                  )}
                </div>
              </TableHead>
            ))}

            {/* Actions column */}
            <TableHead className="w-20">
              <Button size="sm" variant="ghost" onClick={onAddColumn} className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className={`${dragOverEntry === entry.id ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500" : ""} ${
                draggedEntry === entry.id ? "opacity-50" : ""
              }`}
              draggable
              onDragStart={(e) => handleEntryDragStart(e, entry.id)}
              onDragOver={(e) => handleEntryDragOver(e, entry.id)}
              onDragEnter={handleEntryDragEnter}
              onDragLeave={handleEntryDragLeave}
              onDrop={(e) => handleEntryDrop(e, entry.id)}
              onDragEnd={handleEntryDragEnd}
            >
              {/* Selection column */}
              {selectedEntries !== undefined && onSelectEntry && (
                <TableCell>
                  <Checkbox
                    checked={selectedEntries.has(Number(entry.id))}
                    onCheckedChange={(checked) => onSelectEntry(Number(entry.id), checked as boolean)}
                  />
                </TableCell>
              )}

              {/* Drag handle column */}
              <TableCell>
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </TableCell>

              {/* Data columns */}
              {columns.map((column) => (
                <TableCell
                  key={`${entry.id}-${column}`}
                  className="cursor-pointer"
                  onDoubleClick={() => handleCellDoubleClick(entry.id, column)}
                >
                  {editingCell?.entryId === entry.id && editingCell?.column === column ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={handleCellEditSave} className="h-8 w-8 p-0">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCellEditCancel} className="h-8 w-8 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="truncate" title={getEntryValue(entry, column)}>
                      {getEntryValue(entry, column)}
                    </div>
                  )}
                </TableCell>
              ))}

              {/* Actions column */}
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteEntry(entry.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
