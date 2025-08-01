"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GripVertical, Edit2, Save, X, Trash2, Plus } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable, SortableContext as SortableContextProvider } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
}

// Sortable Row Component
function SortableRow({
  entry,
  index,
  columns,
  editingCell,
  editValue,
  onCellEdit,
  onSaveCellEdit,
  onCancelEdit,
  onDeleteEntry,
  setEditValue,
  getEntryValue,
}: {
  entry: SpreadsheetEntry
  index: number
  columns: string[]
  editingCell: { entryId: string; column: string } | null
  editValue: string
  onCellEdit: (entryId: string, column: string, currentValue: string) => void
  onSaveCellEdit: () => void
  onCancelEdit: () => void
  onDeleteEntry: (entryId: string) => void
  setEditValue: (value: string) => void
  getEntryValue: (entry: SpreadsheetEntry, column: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className={`border-b hover:bg-muted/50 ${isDragging ? "bg-muted" : ""}`}>
      <td className="py-1 px-2 text-xs text-muted-foreground w-16">
        <div className="flex items-center gap-1">
          <button className="cursor-grab hover:bg-muted rounded p-1" {...attributes} {...listeners}>
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
                  onKeyPress={(e) => e.key === "Enter" && onSaveCellEdit()}
                  placeholder={isDurationColumn(column) ? "MM:SS" : ""}
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onSaveCellEdit}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="text-xs cursor-pointer hover:bg-muted/50 py-1 px-1 rounded group truncate"
                onClick={() => onCellEdit(entry.id, column, value)}
                title={`${column}: ${value}${isDurationColumn(column) ? " (Click to edit - use MM:SS format)" : ""}`}
              >
                <span className={value === "-" ? "text-muted-foreground" : ""}>{value}</span>
                <Edit2 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 inline" />
              </div>
            )}
          </td>
        )
      })}
      <td className="py-1 px-2 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</td>
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
  )
}

// Sortable Header Component
function SortableHeader({
  column,
  editingHeader,
  editValue,
  onHeaderEdit,
  onSaveHeaderEdit,
  onCancelEdit,
  setEditValue,
}: {
  column: string
  editingHeader: string | null
  editValue: string
  onHeaderEdit: (column: string) => void
  onSaveHeaderEdit: () => void
  onCancelEdit: () => void
  setEditValue: (value: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`text-left py-1 px-2 font-medium text-xs min-w-[100px] max-w-[150px] ${isDragging ? "bg-muted" : ""}`}
    >
      {editingHeader === column ? (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-6 text-xs"
            onKeyPress={(e) => e.key === "Enter" && onSaveHeaderEdit()}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onSaveHeaderEdit}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 group">
          <button className="cursor-grab hover:bg-muted rounded p-1" {...attributes} {...listeners}>
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
            onClick={() => onHeaderEdit(column)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </th>
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
  className = "",
}: SortableSpreadsheetProps) {
  const [editingCell, setEditingCell] = useState<{ entryId: string; column: string } | null>(null)
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [dragType, setDragType] = useState<"row" | "column" | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleCellEdit = (entryId: string, column: string, currentValue: string) => {
    setEditingCell({ entryId, column })
    setEditValue(currentValue === "-" ? "" : currentValue)
  }

  const handleHeaderEdit = (column: string) => {
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id)

    // Determine if we're dragging a row or column
    const isColumn = columns.includes(active.id as string)
    setDragType(isColumn ? "column" : "row")
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      setDragType(null)
      return
    }

    if (dragType === "row") {
      // Handle row reordering
      const oldIndex = entries.findIndex((entry) => entry.id === active.id)
      const newIndex = entries.findIndex((entry) => entry.id === over.id)

      if (oldIndex !== newIndex) {
        const newEntries = arrayMove(entries, oldIndex, newIndex).map((entry, index) => ({
          ...entry,
          position: index + 1,
        }))

        await onEntriesReorder(newEntries)
      }
    } else if (dragType === "column") {
      // Handle column reordering
      const oldIndex = columns.findIndex((column) => column === active.id)
      const newIndex = columns.findIndex((column) => column === over.id)

      if (oldIndex !== newIndex) {
        const newColumns = arrayMove(columns, oldIndex, newIndex)
        await onColumnsReorder(newColumns)
      }
    }

    setActiveId(null)
    setDragType(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
                  <th className="text-left py-1 px-2 font-medium text-xs w-16">#</th>
                  <SortableContextProvider items={columns} strategy={horizontalListSortingStrategy}>
                    {columns.map((column) => (
                      <SortableHeader
                        key={column}
                        column={column}
                        editingHeader={editingHeader}
                        editValue={editValue}
                        onHeaderEdit={handleHeaderEdit}
                        onSaveHeaderEdit={saveHeaderEdit}
                        onCancelEdit={cancelEdit}
                        setEditValue={setEditValue}
                      />
                    ))}
                  </SortableContextProvider>
                  <th className="text-left py-1 px-2 font-medium text-xs w-20">Created</th>
                  <th className="text-left py-1 px-2 font-medium text-xs w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContextProvider items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  {entries.map((entry, index) => (
                    <SortableRow
                      key={entry.id}
                      entry={entry}
                      index={index}
                      columns={columns}
                      editingCell={editingCell}
                      editValue={editValue}
                      onCellEdit={handleCellEdit}
                      onSaveCellEdit={saveCellEdit}
                      onCancelEdit={cancelEdit}
                      onDeleteEntry={onDeleteEntry}
                      setEditValue={setEditValue}
                      getEntryValue={getEntryValue}
                    />
                  ))}
                </SortableContextProvider>
              </tbody>
            </table>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && dragType === "row" ? (
            <div className="bg-background border rounded shadow-lg p-2 opacity-90">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                <span className="text-sm font-medium">Row {entries.findIndex((e) => e.id === activeId) + 1}</span>
              </div>
            </div>
          ) : activeId && dragType === "column" ? (
            <div className="bg-background border rounded shadow-lg p-2 opacity-90">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                <span className="text-sm font-medium">{activeId}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
