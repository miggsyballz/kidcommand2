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
  onBulkDelete?: (entryIds: number[]) => Promise<void>
  showBulkActions?: boolean
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
  selectedEntries = new Set(),
  onSelectEntry,
  onSelectAll,
  onBulkDelete,
  showBulkActions = true,
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
  const [isDragging, setIsDragging] = useState(false)

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const tableRef = useRef<HTMLTableElement>(null)

  // Calculate minimum width needed for column header text
  const getMinColumnWidth = useCallback((column: string) => {
    // Base width calculation: character count * average character width + padding
    const headerTextWidth = column.length * 8 + 60 // 8px per character + 60px padding for icons/grip
    const minWidth = Math.max(150, headerTextWidth) // Minimum 150px, but expand for longer headers
    return Math.min(minWidth, 400) // Cap at 400px to prevent extremely wide columns
  }, [])

  // Initialize column widths with better defaults - only run once per column set
  useEffect(() => {
    const newWidths: Record<string, number> = {}
    let hasChanges = false

    columns.forEach((column) => {
      if (!columnWidths[column]) {
        newWidths[column] = getMinColumnWidth(column)
        hasChanges = true
      }
    })

    if (hasChanges) {
      setColumnWidths((prev) => ({ ...prev, ...newWidths }))
    }
  }, [columns, getMinColumnWidth]) // Remove columnWidths from dependencies to prevent infinite loop

  // Row drag handlers - Only from grip handle
  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation()
    setDraggedRowIndex(index)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())

    // Add visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedRowIndex !== null && draggedRowIndex !== index) {
      setDragOverRowIndex(index)
    }
  }

  const handleRowDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedRowIndex !== null && draggedRowIndex !== index) {
      setDragOverRowIndex(index)
    }
  }

  const handleRowDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear if we're leaving the row entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverRowIndex(null)
    }
  }

  const handleRowDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedRowIndex === null || draggedRowIndex === dropIndex) {
      setDraggedRowIndex(null)
      setDragOverRowIndex(null)
      setIsDragging(false)
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
    setIsDragging(false)
  }

  const handleRowDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "1"
    }
    setDraggedRowIndex(null)
    setDragOverRowIndex(null)
    setIsDragging(false)
  }

  // Column drag handlers - Only from grip handle
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation()
    setDraggedColumnIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedColumnIndex !== null && draggedColumnIndex !== index) {
      setDragOverColumnIndex(index)
    }
  }

  const handleColumnDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

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
    e.stopPropagation()
    setIsResizing(true)
    setResizingColumn(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column] || getMinColumnWidth(column))
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

  // Auto-fit column with better width calculation
  const handleDoubleClick = (column: string) => {
    let maxWidth = getMinColumnWidth(column)

    // Check content width for all entries
    entries.forEach((entry) => {
      const value = getEntryValue(entry, column)
      const cellWidth = value.length * 7 + 20
      maxWidth = Math.max(maxWidth, cellWidth)
    })

    // Cap at reasonable maximum
    maxWidth = Math.min(maxWidth, 500)

    setColumnWidths((prev) => ({
      ...prev,
      [column]: maxWidth,
    }))
  }

  // Edit handlers - Only when not dragging
  const handleCellClick = (entryId: string, column: string, e: React.MouseEvent) => {
    if (isDragging || isResizing) return

    e.stopPropagation()
    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      setEditingCell({ entryId, column })
      const currentValue = getEntryValue(entry, column)
      setEditValue(currentValue === "-" ? "" : currentValue)
    }
  }

  const handleHeaderClick = (column: string, e: React.MouseEvent) => {
    if (isResizing) return

    e.stopPropagation()
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

  // Bulk selection handlers
  const handleSelectEntry = (entryId: number, checked: boolean) => {
    if (onSelectEntry) {
      onSelectEntry(entryId, checked)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked)
    }
  }

  const handleBulkDeleteClick = async () => {
    if (onBulkDelete && selectedEntries.size > 0) {
      const entryIds = Array.from(selectedEntries)
      try {
        await onBulkDelete(entryIds)
      } catch (error) {
        console.error("Error bulk deleting entries:", error)
      }
    }
  }

  const isAllSelected = selectedEntries.size === entries.length && entries.length > 0
  const isIndeterminate = selectedEntries.size > 0 && selectedEntries.size < entries.length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bulk Actions Bar */}
      {showBulkActions && selectedEntries.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedEntries.size} {selectedEntries.size === 1 ? "entry" : "entries"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onBulkDelete && (
              <Button
                onClick={handleBulkDeleteClick}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            )}
            <Button onClick={() => handleSelectAll(false)} variant="outline" size="sm">
              Clear Selection
            </Button>
          </div>
        </div>
      )}

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
                {/* Selection Column */}
                {showBulkActions && onSelectEntry && onSelectAll && (
                  <th className="text-left py-1 px-2 font-medium text-xs w-12">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate
                      }}
                      onCheckedChange={handleSelectAll}
                      title={isAllSelected ? "Deselect all" : "Select all"}
                    />
                  </th>
                )}

                {/* Row Number Column */}
                <th className="text-left py-1 px-2 font-medium text-xs w-16">#</th>

                {/* Data Columns */}
                {columns.map((column, columnIndex) => {
                  const columnWidth = columnWidths[column] || getMinColumnWidth(column)
                  return (
                    <th
                      key={column}
                      className={`text-left py-1 px-2 font-medium text-xs relative ${
                        dragOverColumnIndex === columnIndex ? "bg-blue-100 dark:bg-blue-900/20" : ""
                      } ${draggedColumnIndex === columnIndex ? "opacity-50" : ""}`}
                      style={{
                        width: `${columnWidth}px`,
                        minWidth: `${columnWidth}px`,
                      }}
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
                          <div
                            className="cursor-grab hover:bg-muted rounded p-1 flex-shrink-0"
                            draggable
                            onDragStart={(e) => handleColumnDragStart(e, columnIndex)}
                            onDragOver={(e) => handleColumnDragOver(e, columnIndex)}
                            onDrop={(e) => handleColumnDrop(e, columnIndex)}
                            onDragEnd={handleColumnDragEnd}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span
                            className="flex-1 cursor-pointer min-w-0 overflow-hidden"
                            title={column}
                            onClick={(e) => handleHeaderClick(column, e)}
                          >
                            <span className="block">
                              {column}
                              {isDurationColumn(column) && <span className="text-muted-foreground ml-1">(mm:ss)</span>}
                            </span>
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 opacity-0 group-hover:opacity-100 flex-shrink-0"
                            onClick={(e) => handleHeaderClick(column, e)}
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
                  )
                })}

                {/* Created Column */}
                <th className="text-left py-1 px-2 font-medium text-xs w-20">Created</th>

                {/* Actions Column */}
                <th className="text-left py-1 px-2 font-medium text-xs w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, rowIndex) => {
                const isSelected = selectedEntries.has(Number(entry.id))

                return (
                  <tr
                    key={entry.id}
                    className={`border-b hover:bg-muted/50 ${
                      dragOverRowIndex === rowIndex ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500" : ""
                    } ${draggedRowIndex === rowIndex ? "opacity-50" : ""} ${
                      isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""
                    }`}
                    onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                    onDragEnter={(e) => handleRowDragEnter(e, rowIndex)}
                    onDragLeave={handleRowDragLeave}
                    onDrop={(e) => handleRowDrop(e, rowIndex)}
                  >
                    {/* Selection Column */}
                    {showBulkActions && onSelectEntry && (
                      <td className="py-1 px-2 w-12">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectEntry(Number(entry.id), checked as boolean)}
                          title={isSelected ? "Deselect this entry" : "Select this entry"}
                        />
                      </td>
                    )}

                    {/* Row Number Column */}
                    <td className="py-1 px-2 text-xs text-muted-foreground w-16">
                      <div className="flex items-center gap-1">
                        <div
                          className="cursor-grab hover:bg-muted rounded p-1 active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                          onDragEnd={handleRowDragEnd}
                          title="Drag to reorder row"
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                        </div>
                        {rowIndex + 1}
                      </div>
                    </td>

                    {/* Data Columns */}
                    {columns.map((column) => {
                      const value = getEntryValue(entry, column)
                      const isEditing = editingCell?.entryId === entry.id && editingCell?.column === column
                      const columnWidth = columnWidths[column] || getMinColumnWidth(column)

                      return (
                        <td key={column} className="py-1 px-2" style={{ width: `${columnWidth}px` }}>
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
                              onClick={(e) => handleCellClick(entry.id, column, e)}
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

                    {/* Created Column */}
                    <td className="py-1 px-2 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions Column */}
                    <td className="py-1 px-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => onDeleteEntry(entry.id)}
                        title="Delete this entry"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
