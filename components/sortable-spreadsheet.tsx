"use client"

import React, { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

export default function SortableTable() {
  const [items, setItems] = useState<RowItem[]>(initialItems)

  const sensors = useSensors(useSensor(PointerSensor))

  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)

    setItems((items) => arrayMove(items, oldIndex, newIndex))

    // TODO: Save new order to Supabase if needed
    // debouncedUpdate(items)
  }, [items])

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <MemoSortableRow key={item.id} id={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  )
}

type SortableRowProps = {
  id: string
  item: RowItem
}

const SortableRow = ({ id, item }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

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

const MemoSortableRow = React.memo(SortableRow)
