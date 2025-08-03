"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit2, X, Trash2, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { TableCell, TableRow } from "@/components/ui/table"

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
  const [items, setItems] = useState<string[]>(entries.map((entry) => entry.id))

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
  }, [columns, getMinColumnWidth]) // Removed columnWidths from dependencies to prevent infinite loop

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

  const handleRowClick = (entry: PlaylistEntry, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest("input") || target.closest('[role="checkbox"]')) {
      return
    }
  }

  const handleSelectEntry = (entryId: number, selected: boolean) => {
    onSelectEntry(entryId, selected)
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

  const sensors = useSensors(useSensor(PointerSensor))

  const itemIds = useMemo(() => entries.map((entry) => entry.id), [entries])

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = entries.findIndex((entry) => entry.id === active.id)
      const newIndex = entries.findIndex((entry) => entry.id === over.id)

      setItems((items) => arrayMove(items, oldIndex, newIndex))

      // TODO: Save new order to Supabase if needed
      // debouncedUpdate(items)
    },
    [entries],
  )

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
              <MemoSortableRow key={entry.id} id={entry.id} item={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type RowItem = {
  id: string
  title: string
  artist: string
}

const initialItems: RowItem[] = [
  { id: "1", title: "Song A", artist: "Artist A" },
  { id: "2", title: "Song B", artist: "Artist B" },
  { id: "3", title: "Song C", artist: "Artist C" },
]

const MemoSortableRow = React.memo(SortableRow)

const SortableRow = ({ id, item }: { id: string; item: RowItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  }

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TableCell>{item.title}</TableCell>
      <TableCell>{item.artist}</TableCell>
    </TableRow>
  )
}
