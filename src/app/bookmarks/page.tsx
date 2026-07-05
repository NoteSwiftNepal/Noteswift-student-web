"use client";

import { useEffect, useState } from "react";
import { 
  Bookmark, 
  Trash2, 
  ExternalLink, 
  FileText, 
  FolderPlus, 
  Search,
  Plus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { useToast } from "@/hooks/use-toast";

interface BookmarkItem {
  id: string;
  fileName: string;
  fileUri: string;
  subject?: string;
  bookmarkedAt: string;
}

const initialBookmarks: BookmarkItem[] = [
  { id: "b-1", fileName: "Trigonometry Compounding formulas reference.pdf", fileUri: "http://example.com/math-trig-ref.pdf", subject: "Mathematics", bookmarkedAt: new Date().toISOString() },
  { id: "b-2", fileName: "Mendelian genetics laws cheat sheet.pdf", fileUri: "http://example.com/sci-genetics.pdf", subject: "Science", bookmarkedAt: new Date().toISOString() }
];

function BookmarksContent() {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSubject, setNewSubject] = useState("Mathematics");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("noteswift_student_bookmarks");
      if (stored) {
        try {
          setBookmarks(JSON.parse(stored));
        } catch {
          setBookmarks(initialBookmarks);
        }
      } else {
        localStorage.setItem("noteswift_student_bookmarks", JSON.stringify(initialBookmarks));
        setBookmarks(initialBookmarks);
      }
    }
  }, []);

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newItem: BookmarkItem = {
      id: `b-${Date.now()}`,
      fileName: newTitle.trim(),
      fileUri: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
      subject: newSubject,
      bookmarkedAt: new Date().toISOString()
    };

    const updated = [newItem, ...bookmarks];
    setBookmarks(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("noteswift_student_bookmarks", JSON.stringify(updated));
    }

    toast({
      title: "Bookmark Saved",
      description: `Added "${newTitle}" to bookmarks.`,
    });

    setNewTitle("");
    setNewUrl("");
    setIsAddOpen(false);
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("noteswift_student_bookmarks", JSON.stringify(updated));
    }
    toast({
      title: "Bookmark Removed",
      description: "Successfully deleted bookmark.",
    });
  };

  const filteredBookmarks = bookmarks.filter(b => 
    b.fileName.toLowerCase().includes(search.toLowerCase()) || 
    (b.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-indigo-500 fill-indigo-500/20" />
            My Bookmarks
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Access your saved study templates, cheat sheets, and course reference guides.
          </p>
        </div>

        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs px-4 flex items-center gap-1.5 border border-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Bookmark
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search bookmarked files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 pl-10 border-gray-250 rounded-2xl bg-white text-xs sm:text-sm"
        />
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <Card className="border border-gray-300 bg-white p-12 text-center rounded-2xl max-w-md mx-auto space-y-3 mt-4">
          <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-150">
            <Bookmark className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-800">No Bookmarks Found</h3>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Save PDFs, formulas, or links to access them easily offline.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="border border-gray-250 bg-white hover:shadow-sm transition-all rounded-2xl flex flex-col justify-between overflow-hidden">
              <CardContent className="p-5 space-y-3.5">
                <div className="flex justify-between items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center rounded-xl shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  {bookmark.subject && (
                    <span className="text-[10px] text-indigo-750 font-extrabold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {bookmark.subject}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-800 leading-snug line-clamp-2">
                    {bookmark.fileName}
                  </h4>
                  <span className="text-[9px] text-gray-400 font-bold block">
                    Saved on: {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>

              <div className="bg-gray-50 border-t border-gray-150 px-5 py-3 flex gap-2 justify-end">
                <a 
                  href={bookmark.fileUri} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-650 font-bold hover:underline"
                >
                  Open File
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Bookmark Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-300 p-6 rounded-3xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-indigo-500" />
              Add Custom Bookmark
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-semibold">
              Save any external file URL or course PDF sheet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBookmark} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-gray-650">File Name *</Label>
              <Input
                id="title"
                required
                placeholder="e.g. Science formula sheet, Algebra theorem list"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-10.5 border-gray-250 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="url" className="text-xs font-bold text-gray-655">File Link / URL *</Label>
              <Input
                id="url"
                required
                placeholder="e.g. noteswift.com/pdf/reference.pdf"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-10.5 border-gray-250 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-655">Subject Category</Label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full h-10.5 border border-gray-250 rounded-xl px-3 text-xs sm:text-sm bg-white"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Social Studies">Social Studies</option>
              </select>
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs border border-blue-700"
              >
                Save Bookmark
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddOpen(false)}
                className="border-gray-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <BookmarksContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
