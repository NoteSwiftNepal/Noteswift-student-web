"use client";

import { useEffect, useState } from "react";
import { 
  Download, 
  Trash2, 
  FileText, 
  Search, 
  UploadCloud,
  FileCode,
  HardDrive
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { useToast } from "@/hooks/use-toast";

import { api } from "@/services/api";

interface DownloadItem {
  id: string;
  fileName: string;
  size: string;
  subject: string;
  downloadedAt: string;
  downloadUrl: string;
}

const initialDownloads: DownloadItem[] = [
  { id: "dl-1", fileName: "Quadratic Roots & Algebra Solutions.pdf", size: "4.2 MB", subject: "Mathematics", downloadedAt: new Date().toISOString(), downloadUrl: "#" },
  { id: "dl-2", fileName: "Newtonian Gravity & Freefall animations.mp4", size: "18.5 MB", subject: "Science", downloadedAt: new Date().toISOString(), downloadUrl: "#" }
];

function DownloadsContent() {
  const { toast } = useToast();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const res = await api.getDownloads();
    if (res.success && res.data) {
      if (res.data.length === 0 && typeof window !== "undefined") {
        localStorage.setItem("noteswift_student_downloads", JSON.stringify(initialDownloads));
        setDownloads(initialDownloads);
      } else {
        setDownloads(res.data);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSimulator = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newItem: DownloadItem = {
      id: `dl-${Date.now()}`,
      fileName: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      subject: "Custom Upload",
      downloadedAt: new Date().toISOString(),
      downloadUrl: "#"
    };

    const updated = [newItem, ...downloads];
    setDownloads(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("noteswift_student_downloads", JSON.stringify(updated));
    }
    
    await api.addDownload({
      fileName: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      subject: "Custom Upload"
    });

    toast({
      title: "File Imported",
      description: `Successfully uploaded "${file.name}" to notes bank.`,
    });
  };

  const handleDelete = async (id: string) => {
    const updated = downloads.filter(d => d.id !== id);
    setDownloads(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("noteswift_student_downloads", JSON.stringify(updated));
    }
    await api.deleteDownload(id);
    toast({
      title: "File Removed",
      description: "Successfully deleted study guide.",
    });
  };


  const filteredDownloads = downloads.filter(d => 
    d.fileName.toLowerCase().includes(search.toLowerCase()) || 
    d.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <Download className="h-6 w-6 text-indigo-500" />
            Downloads & PDF Bank
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Access downloaded worksheets, lecture PDFs, and notes stored in local storage cache.
          </p>
        </div>

        {/* Upload simulated buttons */}
        <div className="relative">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs px-4 flex items-center gap-1.5 border border-blue-700 cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            Upload File
          </Button>
          <Input 
            type="file" 
            onChange={handleUploadSimulator}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search downloaded study guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 pl-10 border-gray-250 rounded-2xl bg-white text-xs sm:text-sm"
        />
      </div>

      {/* Downloads list */}
      {filteredDownloads.length === 0 ? (
        <Card className="border border-gray-300 bg-white p-12 text-center rounded-2xl max-w-md mx-auto space-y-3 mt-4">
          <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-150">
            <HardDrive className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-800">No Downloads Found</h3>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Download resources from chapters or drag-and-drop reference files.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDownloads.map((dl) => (
            <div 
              key={dl.id}
              className="p-4 bg-white border border-gray-250 rounded-2xl flex items-center justify-between gap-4 flex-wrap hover:shadow-sm transition-all"
            >
              <div className="flex gap-3.5 items-center min-w-0 flex-1">
                <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center rounded-xl shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-850 truncate leading-snug">{dl.fileName}</h4>
                  <span className="text-[10px] text-gray-450 font-bold block mt-0.5">
                    {dl.size} • {dl.subject} • {new Date(dl.downloadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button 
                  asChild
                  size="sm" 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 font-bold rounded-xl h-9 text-xs px-3 hover:bg-gray-50 bg-white"
                >
                  <a href={dl.downloadUrl} download>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Save
                  </a>
                </Button>
                <Button 
                  onClick={() => handleDelete(dl.id)}
                  size="sm" 
                  variant="destructive" 
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-655 font-bold rounded-xl h-9 text-xs px-3"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DownloadsPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <DownloadsContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
