"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical, Edit2, X, Trash2, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlaylistEntry {
  id: string
  data: Record<string, any>
  position: number
  created_at: string
  playlist_id?: number
}

interface SortableSpreadsheetProps {
  entries: PlaylistEntry[]
  columns: string[]
  onEntriesReorder: (entries: PlaylistEntry[]) => void
  onColumnsReorder: (columns: string[]) => void
  onCellEdit: (entryId: string, column: string, value: any) => Promise<void>
  onHeaderEdit: (oldColumn: string, newColumn: string) => Promise<void>
  onDeleteEntry: (entryId: string) => Promise<void>
  onAddColumn: () => Promise<void>
  getEntryValue: (entry: PlaylistEntry, column: string) => string
  selectedEntries: Set<number>
  onSelectEntry: (entryId: number, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onBulkDelete: (entryIds: number[]) => Promise<void>
  showBulkActions?: boolean
}

// Define SortableRow component first
const SortableRow = React.memo(
  ({
    entry,
    columns,
    columnWidths,
    getMinColumnWidth,
    getEntryValue,
    selectedEntries,
    onSelectEntry,
    showBulkActions,
    draggedRow,
    editingCell,
    tempValue,
    setTempValue,
    handleCellEdit,
    handleCellSave,
    handleCellCancel,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    onDeleteEntry,
  }: {
    entry: PlaylistEntry
    columns: string[]
    columnWidths: Record<string, number>
    getMinColumnWidth: (headerText: string) => number
    getEntryValue: (entry: PlaylistEntry, column: string) => string
    selectedEntries: Set<number>
    onSelectEntry: (entryId: number, checked: boolean) => void
    showBulkActions: boolean
    draggedRow: string | null
    editingCell: { entryId: string; column: string } | null
    tempValue: string
    setTempValue: (value: string) => void
    handleCellEdit: (entryId: string, column: string, value: string) => void
    handleCellSave: () => Promise<void>
    handleCellCancel: () => void
    handleRowDragStart: (e: React.DragEvent, entryId: string) => void
    handleRowDragOver: (e: React.DragEvent) => void
    handleRowDrop: (e: React.DragEvent, targetEntryId: string) => void
    onDeleteEntry: (entryId: string) => Promise<void>
  }) => {
    return (
      <div
        className={cn(
          "flex border-b hover:bg-gray-50 transition-colors",
          draggedRow === entry.id && "opacity-50",
          selectedEntries.has(Number(entry.id)) && "bg-blue-50 hover:bg-blue-100",
        )}
        draggable
        onDragStart={(e) => handleRowDragStart(e, entry.id)}
        onDragOver={handleRowDragOver}
        onDrop={(e) => handleRowDrop(e, entry.id)}
      >
        {/* Checkbox column */}
        {showBulkActions && (
          <div className="w-12 p-2 border-r flex items-center justify-center flex-shrink-0">
            <Checkbox
              checked={selectedEntries.has(Number(entry.id))}
              onCheckedChange={(checked) => onSelectEntry(Number(entry.id), !!checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Drag handle */}
        <div className="w-12 p-2 border-r flex items-center justify-center flex-shrink-0">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
        </div>

        {/* Dynamic columns */}
        {columns.map((column) => (
          <div
            key={column}
            className="border-r p-2 flex items-center group relative flex-shrink-0"
            style={{
              width: columnWidths[column] || getMinColumnWidth(column),
              minWidth: columnWidths[column] || getMinColumnWidth(column),
            }}
          >
            {editingCell?.entryId === entry.id && editingCell?.column === column ? (
              <div className="flex items-center gap-1 w-full">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="h-6 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCellSave()
                    if (e.key === "Escape") handleCellCancel()
                  }}
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0" onClick={handleCellSave}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0" onClick={handleCellCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 w-full min-w-0">
                <span className="text-xs truncate flex-1">{getEntryValue(entry, column)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCellEdit(entry.id, column, getEntryValue(entry, column))
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Row actions */}
        <div className="w-12 p-2 flex items-center justify-center flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteEntry(entry.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  },
)

SortableRow.displayName = "SortableRow"

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
  onBulkDelete,
  showBulkActions = false,
}: SortableSpreadsheetProps) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [draggedRow, setDraggedRow] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<{ entryId: string; column: string } | null>(null)
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const [tempValue, setTempValue] = useState("")
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const tableRef = useRef<HTMLDivElement>(null)

  // Initialize column widths
  const getMinColumnWidth = useCallback((headerText: string) => {
    return Math.max(150, Math.min(400, headerText.length * 8 + 60))
  }, [])

  useEffect(() => {
    const newWidths: Record<string, number> = {}
    let hasChanges = false

    columns.forEach((column) => {
      if (!columnWidths[column]) {
        newWidths[column] = getMinColumnWidth(column)
        hasChanges = true
      } else {
        newWidths[column] = columnWidths[column]
      }
    })

    if (hasChanges) {
      setColumnWidths(newWidths)
    }
  }, [columns, getMinColumnWidth])

  const handleColumnDragStart = (e: React.DragEvent, column: string) => {
    setDraggedColumn(column)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleColumnDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumn) return

    const draggedIndex = columns.findIndex((col) => col === draggedColumn)
    const targetIndex = columns.findIndex((col) => col === targetColumn)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newColumns = [...columns]
    const [draggedCol] = newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, draggedCol)

    onColumnsReorder(newColumns)
    setDraggedColumn(null)
  }

  const handleRowDragStart = (e: React.DragEvent, entryId: string) => {
    setDraggedRow(entryId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleRowDrop = (e: React.DragEvent, targetEntryId: string) => {
    e.preventDefault()
    if (!draggedRow || draggedRow === targetEntryId) return

    const draggedIndex = entries.findIndex((entry) => entry.id === draggedRow)
    const targetIndex = entries.findIndex((entry) => entry.id === targetEntryId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newEntries = [...entries]
    const [draggedEntry] = newEntries.splice(draggedIndex, 1)
    newEntries.splice(targetIndex, 0, draggedEntry)

    // Update positions
    const updatedEntries = newEntries.map((entry, index) => ({
      ...entry,
      position: index + 1,
    }))

    onEntriesReorder(updatedEntries)
    setDraggedRow(null)
  }

  const handleCellEdit = (entryId: string, column: string, value: string) => {
    setEditingCell({ entryId, column })
    setTempValue(value || "")
  }

  const handleCellSave = async () => {
    if (!editingCell) return

    try {
      await onCellEdit(editingCell.entryId, editingCell.column, tempValue)
      setEditingCell(null)
      setTempValue("")
    } catch (error) {
      console.error("Error saving cell:", error)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setTempValue("")
  }

  const handleHeaderEdit = (column: string, title: string) => {
    setEditingHeader(column)
    setTempValue(title)
  }

  const handleHeaderSave = async () => {
    if (!editingHeader) return

    try {
      await onHeaderEdit(editingHeader, tempValue)
      setEditingHeader(null)
      setTempValue("")
    } catch (error) {
      console.error("Error saving header:", error)
    }
  }

  const handleHeaderCancel = () => {
    setEditingHeader(null)
    setTempValue("")
  }

  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault()
    setResizingColumn(column)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[column] || getMinColumnWidth(column))
  }

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return

      const deltaX = e.clientX - resizeStartX
      const newWidth = Math.max(100, resizeStartWidth + deltaX)

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    },
    [resizingColumn, resizeStartX, resizeStartWidth],
  )

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener("mousemove", handleResizeMove)
      document.addEventListener("mouseup", handleResizeEnd)
      return () => {
        document.removeEventListener("mousemove", handleResizeMove)
        document.removeEventListener("mouseup", handleResizeEnd)
      }
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd])

  const handleColumnDoubleClick = (column: string) => {
    // Calculate optimal width based on content and header
    let maxWidth = getMinColumnWidth(column)

    entries.forEach((entry) => {
      const cellValue = getEntryValue(entry, column)
      const contentWidth = cellValue.length * 8 + 40
      maxWidth = Math.max(maxWidth, contentWidth)
    })

    setColumnWidths((prev) => ({
      ...prev,
      [column]: Math.min(maxWidth, 400),
    }))
  }

  const handleSelectAll = (selected: boolean) => {
    onSelectAll(selected)
  }

  const handleBulkDelete = async () => {
    if (selectedEntries.size > 0) {
      await onBulkDelete(Array.from(selectedEntries))
    }
  }

  const allSelected = entries.length > 0 && entries.every((entry) => selectedEntries.has(Number(entry.id)))
  const someSelected = selectedEntries.size > 0 && !allSelected

  return (
    <div className="w-full h-full flex flex-col">
      {/* Bulk Actions Bar */}
      {showBulkActions && selectedEntries.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedEntries.size} {selectedEntries.size === 1 ? "entry" : "entries"} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSelectAll(false)}>
              Clear Selection
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden bg-white flex-1 flex flex-col">
        <div ref={tableRef} className="overflow-auto flex-1">
          <div className="min-w-full">
            {/* Header */}
            <div className="bg-gray-50 border-b flex sticky top-0 z-10">
              {/* Checkbox column header */}
              {showBulkActions && (
                <div className="w-12 p-2 border-r bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = someSelected
                      }
                    }}
                  />
                </div>
              )}

              {/* Drag handle column header */}
              <div className="w-12 p-2 border-r bg-gray-50 flex-shrink-0"></div>

              {columns.map((column) => (
                <div
                  key={column}
                  className={cn(
                    "relative border-r bg-gray-50 flex items-center group flex-shrink-0",
                    draggedColumn === column && "opacity-50",
                  )}
                  style={{
                    width: columnWidths[column] || getMinColumnWidth(column),
                    minWidth: columnWidths[column] || getMinColumnWidth(column),
                  }}
                  draggable
                  onDragStart={(e) => handleColumnDragStart(e, column)}
                  onDragOver={handleColumnDragOver}
                  onDrop={(e) => handleColumnDrop(e, column)}
                  onDoubleClick={() => handleColumnDoubleClick(column)}
                >
                  <div className="flex-1 p-2 min-w-0">
                    {editingHeader === column ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="h-6 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleHeaderSave()
                            if (e.key === "Escape") handleHeaderCancel()
                          }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleHeaderSave}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleHeaderCancel}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium text-xs text-gray-700 truncate flex-1" title={column}>
                          {column}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleHeaderEdit(column, column)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0"
                    onMouseDown={(e) => handleResizeStart(e, column)}
                  />
                </div>
              ))}

              {/* Add column button */}
              <div className="w-12 p-2 bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onAddColumn}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Rows */}
            {entries.map((entry) => (
              <SortableRow
                key={entry.id}
                entry={entry}
                columns={columns}
                columnWidths={columnWidths}
                getMinColumnWidth={getMinColumnWidth}
                getEntryValue={getEntryValue}
                selectedEntries={selectedEntries}
                onSelectEntry={onSelectEntry}
                showBulkActions={showBulkActions}
                draggedRow={draggedRow}
                editingCell={editingCell}
                tempValue={tempValue}
                setTempValue={setTempValue}
                handleCellEdit={handleCellEdit}
                handleCellSave={handleCellSave}
                handleCellCancel={handleCellCancel}
                handleRowDragStart={handleRowDragStart}
                handleRowDragOver={handleRowDragOver}
                handleRowDrop={handleRowDrop}
                onDeleteEntry={onDeleteEntry}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
