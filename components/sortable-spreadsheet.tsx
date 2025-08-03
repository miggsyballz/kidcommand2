"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical, Edit2, X, Trash2, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Column {
  id: string
  title: string
  width: number
}

interface Row {
  id: string
  data: Record<string, any>
}

interface SortableSpreadsheetProps {
  columns: Column[]
  rows: Row[]
  onColumnsChange: (columns: Column[]) => void
  onRowsChange: (rows: Row[]) => void
  onRowClick?: (row: Row) => void
  onRowDelete?: (rowId: string) => void
  selectedEntries?: Set<string>
  onSelectEntry?: (entryId: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  onBulkDelete?: (entryIds: string[]) => void
  showBulkActions?: boolean
}

export function SortableSpreadsheet({
  columns,
  rows,
  onColumnsChange,
  onRowsChange,
  onRowClick,
  onRowDelete,
  selectedEntries = new Set(),
  onSelectEntry,
  onSelectAll,
  onBulkDelete,
  showBulkActions = false,
}: SortableSpreadsheetProps) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [draggedRow, setDraggedRow] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null)
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const [tempValue, setTempValue] = useState("")
  const tableRef = useRef<HTMLDivElement>(null)

  // Calculate minimum column width based on header text
  const getMinColumnWidth = (headerText: string) => {
    return Math.max(120, Math.min(300, headerText.length * 8 + 40))
  }

  // Initialize column widths if not set
  useEffect(() => {
    const needsWidthUpdate = columns.some((col) => !col.width || col.width < 100)
    if (needsWidthUpdate) {
      const updatedColumns = columns.map((col) => ({
        ...col,
        width: col.width || getMinColumnWidth(col.title),
      }))
      onColumnsChange(updatedColumns)
    }
  }, [columns, onColumnsChange])

  const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleColumnDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumnId) return

    const draggedIndex = columns.findIndex((col) => col.id === draggedColumn)
    const targetIndex = columns.findIndex((col) => col.id === targetColumnId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newColumns = [...columns]
    const [draggedCol] = newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, draggedCol)

    onColumnsChange(newColumns)
    setDraggedColumn(null)
  }

  const handleRowDragStart = (e: React.DragEvent, rowId: string) => {
    setDraggedRow(rowId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleRowDrop = (e: React.DragEvent, targetRowId: string) => {
    e.preventDefault()
    if (!draggedRow || draggedRow === targetRowId) return

    const draggedIndex = rows.findIndex((row) => row.id === draggedRow)
    const targetIndex = rows.findIndex((row) => row.id === targetRowId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newRows = [...rows]
    const [draggedRowData] = newRows.splice(draggedIndex, 1)
    newRows.splice(targetIndex, 0, draggedRowData)

    onRowsChange(newRows)
    setDraggedRow(null)
  }

  const handleCellEdit = (rowId: string, columnId: string, value: string) => {
    setEditingCell({ rowId, columnId })
    setTempValue(value || "")
  }

  const handleCellSave = () => {
    if (!editingCell) return

    const newRows = rows.map((row) => {
      if (row.id === editingCell.rowId) {
        return {
          ...row,
          data: {
            ...row.data,
            [editingCell.columnId]: tempValue,
          },
        }
      }
      return row
    })

    onRowsChange(newRows)
    setEditingCell(null)
    setTempValue("")
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setTempValue("")
  }

  const handleHeaderEdit = (columnId: string, title: string) => {
    setEditingHeader(columnId)
    setTempValue(title)
  }

  const handleHeaderSave = () => {
    if (!editingHeader) return

    const newColumns = columns.map((col) => {
      if (col.id === editingHeader) {
        const newWidth = getMinColumnWidth(tempValue)
        return {
          ...col,
          title: tempValue,
          width: Math.max(col.width, newWidth),
        }
      }
      return col
    })

    onColumnsChange(newColumns)
    setEditingHeader(null)
    setTempValue("")
  }

  const handleHeaderCancel = () => {
    setEditingHeader(null)
    setTempValue("")
  }

  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault()
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)
    const column = columns.find((col) => col.id === columnId)
    setResizeStartWidth(column?.width || 120)
  }

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return

      const deltaX = e.clientX - resizeStartX
      const newWidth = Math.max(80, resizeStartWidth + deltaX)

      const newColumns = columns.map((col) => {
        if (col.id === resizingColumn) {
          return { ...col, width: newWidth }
        }
        return col
      })

      onColumnsChange(newColumns)
    },
    [resizingColumn, resizeStartX, resizeStartWidth, columns, onColumnsChange],
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

  const handleColumnDoubleClick = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId)
    if (!column) return

    // Calculate optimal width based on content and header
    let maxWidth = getMinColumnWidth(column.title)

    rows.forEach((row) => {
      const cellValue = String(row.data[columnId] || "")
      const contentWidth = cellValue.length * 8 + 40
      maxWidth = Math.max(maxWidth, contentWidth)
    })

    const newColumns = columns.map((col) => {
      if (col.id === columnId) {
        return { ...col, width: Math.min(maxWidth, 300) }
      }
      return col
    })

    onColumnsChange(newColumns)
  }

  const addColumn = () => {
    const newColumn: Column = {
      id: `col_${Date.now()}`,
      title: "New Column",
      width: getMinColumnWidth("New Column"),
    }
    onColumnsChange([...columns, newColumn])
  }

  const deleteColumn = (columnId: string) => {
    const newColumns = columns.filter((col) => col.id !== columnId)
    const newRows = rows.map((row) => {
      const newData = { ...row.data }
      delete newData[columnId]
      return { ...row, data: newData }
    })
    onColumnsChange(newColumns)
    onRowsChange(newRows)
  }

  const addRow = () => {
    const newRow: Row = {
      id: `row_${Date.now()}`,
      data: {},
    }
    onRowsChange([...rows, newRow])
  }

  const deleteRow = (rowId: string) => {
    if (onRowDelete) {
      onRowDelete(rowId)
    } else {
      const newRows = rows.filter((row) => row.id !== rowId)
      onRowsChange(newRows)
    }
  }

  const handleRowClick = (row: Row, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest("input") || target.closest('[role="checkbox"]')) {
      return
    }

    if (onRowClick) {
      onRowClick(row)
    }
  }

  const handleSelectEntry = (entryId: string, selected: boolean) => {
    if (onSelectEntry) {
      onSelectEntry(entryId, selected)
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (onSelectAll) {
      onSelectAll(selected)
    }
  }

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedEntries.size > 0) {
      onBulkDelete(Array.from(selectedEntries))
    }
  }

  const allSelected = rows.length > 0 && rows.every((row) => selectedEntries.has(row.id))
  const someSelected = selectedEntries.size > 0 && !allSelected

  return (
    <div className="w-full">
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

      <div className="border rounded-lg overflow-hidden bg-white">
        <div ref={tableRef} className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="bg-gray-50 border-b flex">
              {/* Checkbox column header */}
              {showBulkActions && (
                <div className="w-12 p-2 border-r bg-gray-50 flex items-center justify-center">
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
              <div className="w-12 p-2 border-r bg-gray-50"></div>

              {columns.map((column) => (
                <div
                  key={column.id}
                  className={cn(
                    "relative border-r bg-gray-50 flex items-center group",
                    draggedColumn === column.id && "opacity-50",
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.width,
                  }}
                  draggable
                  onDragStart={(e) => handleColumnDragStart(e, column.id)}
                  onDragOver={handleColumnDragOver}
                  onDrop={(e) => handleColumnDrop(e, column.id)}
                  onDoubleClick={() => handleColumnDoubleClick(column.id)}
                >
                  <div className="flex-1 p-2 min-w-0">
                    {editingHeader === column.id ? (
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
                        <span className="font-medium text-xs text-gray-700 truncate flex-1">{column.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleHeaderEdit(column.id, column.title)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteColumn(column.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0"
                    onMouseDown={(e) => handleResizeStart(e, column.id)}
                  />
                </div>
              ))}

              {/* Add column button */}
              <div className="w-12 p-2 bg-gray-50 flex items-center justify-center">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={addColumn}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, rowIndex) => (
              <div
                key={row.id}
                className={cn(
                  "flex border-b hover:bg-gray-50 transition-colors cursor-pointer",
                  draggedRow === row.id && "opacity-50",
                  selectedEntries.has(row.id) && "bg-blue-50 hover:bg-blue-100",
                )}
                onClick={(e) => handleRowClick(row, e)}
                draggable
                onDragStart={(e) => handleRowDragStart(e, row.id)}
                onDragOver={handleRowDragOver}
                onDrop={(e) => handleRowDrop(e, row.id)}
              >
                {/* Checkbox column */}
                {showBulkActions && (
                  <div className="w-12 p-2 border-r flex items-center justify-center">
                    <Checkbox
                      checked={selectedEntries.has(row.id)}
                      onCheckedChange={(checked) => handleSelectEntry(row.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* Drag handle */}
                <div className="w-12 p-2 border-r flex items-center justify-center">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                </div>

                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="border-r p-2 flex items-center group relative"
                    style={{
                      width: column.width,
                      minWidth: column.width,
                    }}
                  >
                    {editingCell?.rowId === row.id && editingCell?.columnId === column.id ? (
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={handleCellSave}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={handleCellCancel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 w-full min-w-0">
                        <span className="text-xs text-gray-900 truncate flex-1">{row.data[column.id] || ""}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCellEdit(row.id, column.id, row.data[column.id] || "")
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Row actions */}
                <div className="w-12 p-2 flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRow(row.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add row button */}
        <div className="p-2 border-t bg-gray-50">
          <Button size="sm" variant="ghost" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>
      </div>
    </div>
  )
}
