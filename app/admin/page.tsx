"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<{ materials_count?: number; monthly_records_count?: number; message?: string } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadStatus("idle");
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("idle");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/admin/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadResult(res.data);
      setUploadStatus("success");
    } catch (err: any) {
      console.error(err);
      setUploadResult({ message: err.response?.data?.detail || "An unexpected error occurred during import." });
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin Control
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage system data, import inventory spreadsheets, and configure settings.
            </p>
          </div>
        </div>

        {/* DATA IMPORT CARD */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Data Import</CardTitle>
            <CardDescription>
              Upload your procurement Excel file (e.g. procurement-data.xlsx) to populate the database.
              The sheet must be named "IND" and contain the required columns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* DROPZONE */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-400 hover:bg-muted/50",
                file && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
              )}
            >
              <input {...getInputProps()} />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                    Click or drag to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Click to upload or drag and drop</p>
                    <p className="text-sm">XLSX or XLS files only</p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => { setFile(null); setUploadStatus("idle"); setUploadResult(null); }}
                disabled={!file || isUploading}
              >
                Clear
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <UploadCloud className="w-4 h-4" />
                    <span>Import Data</span>
                  </div>
                )}
              </Button>
            </div>

            {/* STATUS MESSAGES */}
            {uploadStatus === "success" && uploadResult && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Import Successful</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-1">
                    {uploadResult.message}. Processed {uploadResult.materials_count} materials and {uploadResult.monthly_records_count} monthly records.
                  </p>
                </div>
              </div>
            )}

            {uploadStatus === "error" && uploadResult && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Import Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {uploadResult.message}
                  </p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
