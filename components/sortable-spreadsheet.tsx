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
  // Editing state
  const [editingCell, setEditingCell] = useState<{ entryId: string; column: string } | null>(null)
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  // Drag and drop state
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null)
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null)
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null)
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null)

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const tableRef = useRef<HTMLTableElement>(null)

  // Initialize column widths
  useEffect(() => {
    const newWidths: Record<string, number> = {}
    columns.forEach((column) => {
      if (!columnWidths[column]) {
        newWidths[column] = 120
      }
    })
    if (Object.keys(newWidths).length > 0) {
      setColumnWidths((prev) => ({ ...prev, ...newWidths }))
    }
  }, [columns])

  // Row drag handlers
  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRowIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedRowIndex !== null && draggedRowIndex !== index) {
      setDragOverRowIndex(index)
    }
  }

  const handleRowDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedRowIndex === null || draggedRowIndex === dropIndex) {
      setDraggedRowIndex(null)
      setDragOverRowIndex(null)
      return
    }

    const newEntries = [...entries]
    const [draggedEntry] = newEntries.splice(draggedRowIndex, 1)
    newEntries.splice(dropIndex, 0, draggedEntry)

    // Update positions
    const updatedEntries = newEntries.map((entry, index) => ({
      ...entry,
      position: index + 1,
    }))

    try {
      await onEntriesReorder(updatedEntries)
    } catch (error) {
      console.error("Error reordering entries:", error)
    }

    setDraggedRowIndex(null)
    setDragOverRowIndex(null)
  }

  const handleRowDragEnd = () => {
    setDraggedRowIndex(null)
    setDragOverRowIndex(null)
  }

  // Column drag handlers
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedColumnIndex !== null && draggedColumnIndex !== index) {
      setDragOverColumnIndex(index)
    }
  }

  const handleColumnDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedColumnIndex === null || draggedColumnIndex === dropIndex) {
      setDraggedColumnIndex(null)
      setDragOverColumnIndex(null)
      return
    }

    const newColumns = [...columns]
    const [draggedColumn] = newColumns.splice(draggedColumnIndex, 1)
    newColumns.splice(dropIndex, 0, draggedColumn)

    try {
      await onColumnsReorder(newColumns)
    } catch (error) {
      console.error("Error reordering columns:", error)
    }

    setDraggedColumnIndex(null)
    setDragOverColumnIndex(null)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null)
    setDragOverColumnIndex(null)
  }

  // Column resize handlers
  const handleMouseDown = (e: React.MouseEvent, column: string) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column] || 120)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizingColumn) return

      const diff = e.clientX - startX
      const newWidth = Math.max(80, startWidth + diff)

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    },
    [isResizing, resizingColumn, startX, startWidth],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Auto-fit column
  const handleDoubleClick = (column: string) => {
    let maxWidth = 80
    const headerWidth = column.length * 8 + 60
    maxWidth = Math.max(maxWidth, headerWidth)

    entries.forEach((entry) => {
      const value = getEntryValue(entry, column)
      const cellWidth = value.length * 7 + 20
      maxWidth = Math.max(maxWidth, cellWidth)
    })

    maxWidth = Math.min(maxWidth, 300)

    setColumnWidths((prev) => ({
      ...prev,
      [column]: maxWidth,
    }))
  }

  // Edit handlers
  const handleCellClick = (entryId: string, column: string) => {
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
          <table ref={tableRef} className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
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
                {columns.map((column, columnIndex) => (
                  <th
                    key={column}
                    className={`text-left py-1 px-2 font-medium text-xs relative ${
                      dragOverColumnIndex === columnIndex ? "bg-blue-100 dark:bg-blue-900/20" : ""
                    } ${draggedColumnIndex === columnIndex ? "opacity-50" : ""}`}
                    style={{ width: `${columnWidths[column] || 120}px` }}
                    draggable
                    onDragStart={(e) => handleColumnDragStart(e, columnIndex)}
                    onDragOver={(e) => handleColumnDragOver(e, columnIndex)}
                    onDrop={(e) => handleColumnDrop(e, columnIndex)}
                    onDragEnd={handleColumnDragEnd}
                  >
                    {editingHeader === column ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 text-xs"
                          onKeyPress={(e) => e.key === "Enter" && saveHeaderEdit()}
                          autoFocus
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
                        <div className="cursor-grab hover:bg-muted rounded p-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span
                          className="truncate flex-1 cursor-pointer"
                          title={column}
                          onClick={() => handleHeaderClick(column)}
                        >
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
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 z-10"
                      onMouseDown={(e) => handleMouseDown(e, column)}
                      onDoubleClick={() => handleDoubleClick(column)}
                      title="Drag to resize, double-click to auto-fit"
                    />
                  </th>
                ))}
                <th className="text-left py-1 px-2 font-medium text-xs w-20">Created</th>
                <th className="text-left py-1 px-2 font-medium text-xs w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, rowIndex) => (
                <tr
                  key={entry.id}
                  className={`border-b hover:bg-muted/50 ${
                    dragOverRowIndex === rowIndex ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500" : ""
                  } ${draggedRowIndex === rowIndex ? "opacity-50" : ""} ${
                    selectedEntries?.has(Number(entry.id)) ? "bg-blue-50" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                  onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                  onDrop={(e) => handleRowDrop(e, rowIndex)}
                  onDragEnd={handleRowDragEnd}
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
                      <div className="cursor-grab hover:bg-muted rounded p-1">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                      </div>
                      {rowIndex + 1}
                    </div>
                  </td>
                  {columns.map((column) => {
                    const value = getEntryValue(entry, column)
                    const isEditing = editingCell?.entryId === entry.id && editingCell?.column === column

                    return (
                      <td key={column} className="py-1 px-2" style={{ width: `${columnWidths[column] || 120}px` }}>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-6 text-xs"
                              onKeyPress={(e) => e.key === "Enter" && saveCellEdit()}
                              placeholder={isDurationColumn(column) ? "MM:SS" : ""}
                              autoFocus
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
