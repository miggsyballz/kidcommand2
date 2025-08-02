"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LibraryContent } from "@/components/LibraryContent"
import { UploadDataContent } from "@/components/upload-data-content"

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Music Library</h1>
        <p className="text-muted-foreground">Manage your music collection and upload new tracks</p>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Music</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <LibraryContent />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <UploadDataContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
