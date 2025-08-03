"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
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

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  const dragCounter = useRef(0)
  const tableRef = useRef<HTMLTableElement>(null)

  // Initialize default column widths
  useEffect(() => {
    const defaultWidths: Record<string, number> = {}
    columns.forEach((column) => {
      if (!columnWidths[column]) {
        defaultWidths[column] = 120 // Default width
      }
    })
    if (Object.keys(defaultWidths).length > 0) {
      setColumnWidths((prev) => ({ ...prev, ...defaultWidths }))
    }
  }, [columns, columnWidths])

  // Column resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, column: string) => {
      e.preventDefault()
      e.stopPropagation()
      setResizingColumn(column)
      setResizeStartX(e.clientX)
      setResizeStartWidth(columnWidths[column] || 120)
      document.addEventListener("mousemove", handleResizeMove)
      document.addEventListener("mouseup", handleResizeEnd)
    },
    [columnWidths],
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return

      const deltaX = e.clientX - resizeStartX
      const newWidth = Math.max(80, resizeStartWidth + deltaX) // Minimum width of 80px

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    },
    [resizingColumn, resizeStartX, resizeStartWidth],
  )

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleResizeEnd)
  }, [handleResizeMove])

  // Auto-fit column width to content
  const handleAutoFit = useCallback(
    (column: string) => {
      if (!tableRef.current) return

      // Find the longest content in this column
      let maxWidth = 80 // Minimum width
      const headerWidth = column.length * 8 + 60 // Approximate header width
      maxWidth = Math.max(maxWidth, headerWidth)

      // Check all cell values in this column
      entries.forEach((entry) => {
        const value = getEntryValue(entry, column)
        const cellWidth = value.length * 7 + 20 // Approximate cell width
        maxWidth = Math.max(maxWidth, cellWidth)
      })

      // Cap at reasonable maximum
      maxWidth = Math.min(maxWidth, 300)

      setColumnWidths((prev) => ({
        ...prev,
        [column]: maxWidth,
      }))
    },
    [entries, getEntryValue],
  )

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
    if (isDragging || resizingColumn) return

    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      setEditingCell({ entryId, column })
      const currentValue = getEntryValue(entry, column)
      setEditValue(currentValue === "-" ? "" : currentValue)
    }
  }

  const handleHeaderClick = (column: string) => {
    if (resizingColumn) return
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

  // Generate CSS custom properties for column widths
  const tableStyle = {
    "--selection-width": "48px",
    "--row-number-width": "64px",
    "--created-width": "80px",
    "--actions-width": "64px",
    ...Object.fromEntries(
      columns.map((column) => [
        `--col-${column.replace(/[^a-zA-Z0-9]/g, "_")}-width`,
        `${columnWidths[column] || 120}px`,
      ]),
    ),
  } as React.CSSProperties

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
          <table
            ref={tableRef}
            className="w-full border-collapse text-sm"
            style={{ ...tableStyle, tableLayout: "fixed" }}
          >
            <thead>
              <tr className="border-b">
                {onSelectEntry && (
                  <th className="text-left py-1 px-2 font-medium text-xs" style={{ width: "var(--selection-width)" }}>
                    <Checkbox
                      checked={selectedEntries?.size === entries.length && entries.length > 0}
                      onCheckedChange={onSelectAll}
                    />
                  </th>
                )}
                <th className="text-left py-1 px-2 font-medium text-xs" style={{ width: "var(--row-number-width)" }}>
                  #
                </th>
                {columns.map((column, index) => (
                  <th
                    key={column}
                    className={`text-left py-1 px-2 font-medium text-xs relative ${
                      dragOverColumn === column ? "bg-blue-100 dark:bg-blue-900/20" : ""
                    } ${draggedColumn === column ? "opacity-50" : ""}`}
                    style={{ width: `var(--col-${column.replace(/[^a-zA-Z0-9]/g, "_")}-width)` }}
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
                        <span className="truncate flex-1" title={column} onClick={() => handleHeaderClick(column)}>
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

                    {/* Column Resize Handle */}
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:w-0.5 z-10"
                      onMouseDown={(e) => handleResizeStart(e, column)}
                      onDoubleClick={() => handleAutoFit(column)}
                      title="Drag to resize, double-click to auto-fit"
                    />
                  </th>
                ))}
                <th className="text-left py-1 px-2 font-medium text-xs" style={{ width: "var(--created-width)" }}>
                  Created
                </th>
                <th className="text-left py-1 px-2 font-medium text-xs" style={{ width: "var(--actions-width)" }}>
                  Actions
                </th>
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
                    <td className="py-1 px-2">
                      <Checkbox
                        checked={selectedEntries?.has(Number(entry.id)) || false}
                        onCheckedChange={(checked) => onSelectEntry(Number(entry.id), checked as boolean)}
                      />
                    </td>
                  )}
                  <td className="py-1 px-2 text-xs text-muted-foreground">
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
                      <td key={column} className="py-1 px-2">
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

      {/* Resize indicator */}
      {resizingColumn && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}
    </div>
  )
}
