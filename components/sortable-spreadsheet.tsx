"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GripVertical, Edit2, X, Trash2, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
  const [editingCell, setEditingCell] = useState<{ entryId: string; column: string } | null>(null)
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState("")
  const [draggedEntry, setDraggedEntry] = useState<string | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  const allSelected = entries.length > 0 && entries.every((entry) => selectedEntries.has(Number(entry.id)))
  const someSelected = selectedEntries.size > 0 && !allSelected

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
      toast.error("Failed to save changes")
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setTempValue("")
  }

  const handleHeaderEdit = (column: string) => {
    setEditingHeader(column)
    setTempValue(column)
  }

  const handleHeaderSave = async () => {
    if (!editingHeader || !tempValue.trim()) return

    try {
      await onHeaderEdit(editingHeader, tempValue.trim())
      setEditingHeader(null)
      setTempValue("")
    } catch (error) {
      console.error("Error saving header:", error)
      toast.error("Failed to save header")
    }
  }

  const handleHeaderCancel = () => {
    setEditingHeader(null)
    setTempValue("")
  }

  const handleEntryDragStart = (e: React.DragEvent, entryId: string) => {
    setDraggedEntry(entryId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleEntryDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleEntryDrop = (e: React.DragEvent, targetEntryId: string) => {
    e.preventDefault()
    if (!draggedEntry || draggedEntry === targetEntryId) return

    const draggedIndex = entries.findIndex((entry) => entry.id === draggedEntry)
    const targetIndex = entries.findIndex((entry) => entry.id === targetEntryId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newEntries = [...entries]
    const [draggedEntryData] = newEntries.splice(draggedIndex, 1)
    newEntries.splice(targetIndex, 0, draggedEntryData)

    // Update positions
    const updatedEntries = newEntries.map((entry, index) => ({
      ...entry,
      position: index + 1,
    }))

    onEntriesReorder(updatedEntries)
    setDraggedEntry(null)
  }

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

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return

    try {
      await onBulkDelete(Array.from(selectedEntries))
    } catch (error) {
      console.error("Error bulk deleting:", error)
      toast.error("Failed to delete selected entries")
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Bulk Actions Bar */}
      {showBulkActions && selectedEntries.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedEntries.size} {selectedEntries.size === 1 ? "entry" : "entries"} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onSelectAll(false)}>
              Clear Selection
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-white">
        <div className="overflow-auto h-full">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Checkbox column header */}
                {showBulkActions && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={onSelectAll}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someSelected
                        }
                      }}
                    />
                  </TableHead>
                )}

                {/* Drag handle column header */}
                <TableHead className="w-12"></TableHead>

                {/* Dynamic columns */}
                {columns.map((column) => (
                  <TableHead
                    key={column}
                    className={cn(
                      "relative group cursor-move min-w-[150px] max-w-[400px]",
                      draggedColumn === column && "opacity-50",
                    )}
                    draggable
                    onDragStart={(e) => handleColumnDragStart(e, column)}
                    onDragOver={handleColumnDragOver}
                    onDrop={(e) => handleColumnDrop(e, column)}
                  >
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
                        <span className="font-medium text-xs truncate flex-1">{column}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHeaderEdit(column)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableHead>
                ))}

                {/* Add column button */}
                <TableHead className="w-12">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onAddColumn}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    draggedEntry === entry.id && "opacity-50",
                    selectedEntries.has(Number(entry.id)) && "bg-blue-50 hover:bg-blue-100",
                  )}
                  draggable
                  onDragStart={(e) => handleEntryDragStart(e, entry.id)}
                  onDragOver={handleEntryDragOver}
                  onDrop={(e) => handleEntryDrop(e, entry.id)}
                >
                  {/* Checkbox column */}
                  {showBulkActions && (
                    <TableCell>
                      <Checkbox
                        checked={selectedEntries.has(Number(entry.id))}
                        onCheckedChange={(checked) => onSelectEntry(Number(entry.id), !!checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}

                  {/* Drag handle */}
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                  </TableCell>

                  {/* Dynamic columns */}
                  {columns.map((column) => (
                    <TableCell key={column} className="group relative min-w-[150px] max-w-[400px]">
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
                    </TableCell>
                  ))}

                  {/* Row actions */}
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
