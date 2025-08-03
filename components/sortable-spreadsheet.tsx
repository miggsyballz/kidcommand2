"use client"

import type React from "react"
import { useState, useRef } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Trash2, Edit2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Music } from "lucide-react" // Import Music component

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
  onBulkDelete?: (entryIds: number[]) => Promise<void>
  showBulkActions?: boolean
}

// Define columns that should be half width
const NARROW_COLUMNS = new Set(["category", "energy", "era", "mood", "sound", "tempo", "type", "uid"])

function SortableHeader({
  column,
  onEdit,
  isNarrow = false,
}: {
  column: string
  onEdit: (oldColumn: string, newColumn: string) => void
  isNarrow?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column })

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(column)
  const [columnWidth, setColumnWidth] = useState(isNarrow ? 80 : 150)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: `${columnWidth}px`,
    minWidth: isNarrow ? "60px" : "100px",
    maxWidth: isNarrow ? "120px" : "300px",
  }

  const handleEdit = () => {
    if (editValue.trim() && editValue !== column) {
      onEdit(column, editValue.trim())
    }
    setIsEditing(false)
    setEditValue(column)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(column)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = columnWidth

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current
      const newWidth = Math.max(isNarrow ? 60 : 100, Math.min(isNarrow ? 120 : 300, startWidthRef.current + diff))
      setColumnWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleDoubleClick = () => {
    // Auto-fit column width based on content
    setColumnWidth(isNarrow ? 80 : 150)
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative bg-muted/50 font-semibold text-xs uppercase tracking-wide border-r border-border/50 select-none",
        isDragging && "z-50 shadow-lg bg-background border",
        isResizing && "select-none",
      )}
    >
      <div className="flex items-center justify-between h-full min-h-[40px] px-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-60 hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3" />
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleEdit}
                className="h-6 text-xs px-1 flex-1 min-w-0"
                autoFocus
              />
            </div>
          ) : (
            <div
              className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:bg-muted/50 rounded px-1 py-1"
              onClick={() => setIsEditing(true)}
              onDoubleClick={handleDoubleClick}
            >
              <span className="truncate text-xs font-medium">{column}</span>
              <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors"
          onMouseDown={handleMouseDown}
        />
      </div>
    </TableHead>
  )
}

function SortableRow({
  entry,
  columns,
  onCellEdit,
  onDeleteEntry,
  getEntryValue,
  isSelected,
  onSelectEntry,
}: {
  entry: Entry
  columns: string[]
  onCellEdit: (entryId: string, column: string, value: any) => Promise<void>
  onDeleteEntry: (entryId: string) => Promise<void>
  getEntryValue: (entry: Entry, column: string) => string
  isSelected?: boolean
  onSelectEntry?: (entryId: number, checked: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })

  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleCellEdit = async (column: string, value: string) => {
    try {
      await onCellEdit(entry.id, column, value)
      setEditingCell(null)
    } catch (error) {
      console.error("Failed to edit cell:", error)
    }
  }

  const handleCellClick = (column: string, currentValue: string) => {
    setEditingCell(column)
    setEditValue(currentValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent, column: string) => {
    if (e.key === "Enter") {
      handleCellEdit(column, editValue)
    } else if (e.key === "Escape") {
      setEditingCell(null)
    }
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:bg-muted/30 transition-colors border-b border-border/30",
        isDragging && "z-50 shadow-lg bg-background border",
        isSelected && "bg-blue-50 dark:bg-blue-950/20",
      )}
    >
      {/* Selection checkbox */}
      {onSelectEntry && (
        <TableCell className="w-12 p-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectEntry(Number(entry.id), checked as boolean)}
          />
        </TableCell>
      )}

      {/* Drag handle */}
      <TableCell className="w-12 p-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-60 hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>

      {/* Data cells */}
      {columns.map((column) => {
        const value = getEntryValue(entry, column)
        const isEditing = editingCell === column
        const isNarrow = NARROW_COLUMNS.has(column.toLowerCase())

        return (
          <TableCell
            key={column}
            className={cn(
              "border-r border-border/30 p-2 text-sm",
              isNarrow ? "max-w-[120px] min-w-[60px]" : "max-w-[300px] min-w-[100px]",
            )}
            style={{
              width: isNarrow ? "80px" : "150px",
            }}
          >
            {isEditing ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, column)}
                onBlur={() => handleCellEdit(column, editValue)}
                className="h-7 text-sm px-2 w-full"
                autoFocus
              />
            ) : (
              <div
                className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[28px] flex items-center truncate"
                onClick={() => handleCellClick(column, value)}
                title={value}
              >
                {value || "-"}
              </div>
            )}
          </TableCell>
        )
      })}

      {/* Actions */}
      <TableCell className="w-16 p-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteEntry(entry.id)}
            className="h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
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
  selectedEntries = new Set(),
  onSelectEntry,
  onSelectAll,
  onBulkDelete,
  showBulkActions = false,
}: SortableSpreadsheetProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragType, setDragType] = useState<"column" | "row" | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveId(active.id)

    // Determine if we're dragging a column or row
    if (columns.includes(active.id)) {
      setDragType("column")
    } else {
      setDragType("row")
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      setDragType(null)
      return
    }

    if (dragType === "column") {
      const oldIndex = columns.indexOf(active.id)
      const newIndex = columns.indexOf(over.id)
      const newColumns = arrayMove(columns, oldIndex, newIndex)
      onColumnsReorder(newColumns)
    } else if (dragType === "row") {
      const oldIndex = entries.findIndex((entry) => entry.id === active.id)
      const newIndex = entries.findIndex((entry) => entry.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newEntries = arrayMove(entries, oldIndex, newIndex).map((entry, index) => ({
          ...entry,
          position: index + 1,
        }))
        onEntriesReorder(newEntries)
      }
    }

    setActiveId(null)
    setDragType(null)
  }

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0 || !onBulkDelete) return

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedEntries.size} selected songs?`)
    if (confirmed) {
      await onBulkDelete(Array.from(selectedEntries))
    }
  }

  const allSelected = entries.length > 0 && selectedEntries.size === entries.length
  const someSelected = selectedEntries.size > 0 && selectedEntries.size < entries.length

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {showBulkActions && selectedEntries.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {selectedEntries.size} selected
            </Badge>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedEntries.size === 1 ? "1 song selected" : `${selectedEntries.size} songs selected`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectAll?.(false)}
              className="text-blue-700 border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
            >
              Clear Selection
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Spreadsheet */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <div className="overflow-auto max-h-[70vh]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={dragType === "column" ? [restrictToHorizontalAxis] : []}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="border-b-2 border-border hover:bg-transparent">
                  {/* Selection header */}
                  {showBulkActions && onSelectAll && (
                    <TableHead className="w-12 p-2 bg-muted/50">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected
                        }}
                        onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                      />
                    </TableHead>
                  )}

                  {/* Drag handle header */}
                  <TableHead className="w-12 p-2 bg-muted/50">
                    <GripVertical className="h-4 w-4 opacity-40" />
                  </TableHead>

                  {/* Column headers */}
                  <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
                    {columns.map((column) => (
                      <SortableHeader
                        key={column}
                        column={column}
                        onEdit={onHeaderEdit}
                        isNarrow={NARROW_COLUMNS.has(column.toLowerCase())}
                      />
                    ))}
                  </SortableContext>

                  {/* Add column button */}
                  <TableHead className="w-16 p-2 bg-muted/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onAddColumn}
                      className="h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TableHead>

                  {/* Actions header */}
                  <TableHead className="w-16 p-2 bg-muted/50">
                    <span className="text-xs opacity-60">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <SortableContext items={entries.map((e) => e.id)}>
                  {entries.map((entry) => (
                    <SortableRow
                      key={entry.id}
                      entry={entry}
                      columns={columns}
                      onCellEdit={onCellEdit}
                      onDeleteEntry={onDeleteEntry}
                      getEntryValue={getEntryValue}
                      isSelected={selectedEntries.has(Number(entry.id))}
                      onSelectEntry={onSelectEntry}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No songs found</p>
          <p className="text-sm">Upload a CSV or Excel file to get started</p>
        </div>
      )}
    </div>
  )
}
