"use client";

import { useState, useCallback } from "react";
import api from "@/app/lib/api";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Settings as SettingsIcon, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<{ materials_count?: number; monthly_records_count?: number; message?: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  // Purchase Orders Import States
  const [poFile, setPoFile] = useState<File | null>(null);
  const [isPoUploading, setIsPoUploading] = useState(false);
  const [poUploadStatus, setPoUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [poUploadResult, setPoUploadResult] = useState<{ pos_count?: number; message?: string } | null>(null);
  const [poProgress, setPoProgress] = useState(0);
  const [poProgressMessage, setPoProgressMessage] = useState("");

// Purchase Orders Import States
  const [AlternativeFile, setAlternativeFile] = useState<File | null>(null);
  const [isAlternativeUploading, setIsAlternativeUploading] = useState(false);
  const [AlternativeUploadStatus, setAlternativeUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [AlternativeUploadResult, setAlternativeUploadResult] = useState<{ pos_count?: number; message?: string } | null>(null);
  const [AlternativeProgress, setAlternativeProgress] = useState(0);
  const [AlternativeProgressMessage, setAlternativeProgressMessage] = useState("");


  // Prediction Engine States
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictStatus, setPredictStatus] = useState<"idle" | "success" | "error">("idle");
  const [predictResult, setPredictResult] = useState<{ predictions_count?: number; message?: string } | null>(null);
  const [predictProgress, setPredictProgress] = useState(0);
  const [predictMessage, setPredictMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadStatus("idle");
      setUploadResult(null);
      setProgress(0);
      setProgressMessage("");
    }
  }, []);

  const onPoDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPoFile(acceptedFiles[0]);
      setPoUploadStatus("idle");
      setPoUploadResult(null);
      setPoProgress(0);
      setPoProgressMessage("");
    }
  }, []);

  const onAlternativeDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAlternativeFile(acceptedFiles[0]);
      setAlternativeUploadStatus("idle");
      setAlternativeUploadResult(null);
      setAlternativeProgress(0);
      setAlternativeProgressMessage("");
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

  const { getRootProps: getPoRootProps, getInputProps: getPoInputProps, isDragActive: isPoDragActive } = useDropzone({
    onDrop: onPoDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
    },
    maxFiles: 1,
  });

  const { getRootProps: getAlternativeRootProps, getInputProps: getAlternativeInputProps, isDragActive: isAlternativeDragActive } = useDropzone({
    onDrop: onAlternativeDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
    },
    maxFiles: 1,
  });

  const pollStatus = async (taskId: string) => {
    try {
      const res = await api.get(`/admin/upload/status/${taskId}`);
      setProgress(res.data.progress);
      setProgressMessage(res.data.message);

      if (res.data.status === "completed") {
        setUploadResult({
          message: res.data.message,
          materials_count: res.data.materials_count,
          monthly_records_count: res.data.monthly_records_count
        });
        setUploadStatus("success");
        setIsUploading(false);
      } else if (res.data.status === "failed") {
        setUploadResult({ message: res.data.error || "Import failed" });
        setUploadStatus("error");
        setIsUploading(false);
      } else {
        // Continue polling
        setTimeout(() => pollStatus(taskId), 1000);
      }
    } catch (err: any) {
      setUploadResult({ message: "Failed to fetch status" });
      setUploadStatus("error");
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("idle");
    setProgress(0);
    setProgressMessage("Starting upload...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/admin/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const taskId = res.data.task_id;
      pollStatus(taskId);
    } catch (err: any) {
      console.error(err);
      setUploadResult({ message: err.response?.data?.detail || "An unexpected error occurred during import." });
      setUploadStatus("error");
      setIsUploading(false);
    }
  };

  const pollPoStatus = async (taskId: string) => {
    try {
      const res = await api.get(`/admin/upload-pos/status/${taskId}`);
      setPoProgress(res.data.progress);
      setPoProgressMessage(res.data.message);

      if (res.data.status === "completed") {
        setPoUploadResult({
          message: res.data.message,
          pos_count: res.data.pos_count
        });
        setPoUploadStatus("success");
        setIsPoUploading(false);
      } else if (res.data.status === "failed") {
        setPoUploadResult({ message: res.data.error || "Import failed" });
        setPoUploadStatus("error");
        setIsPoUploading(false);
      } else {
        // Continue polling
        setTimeout(() => pollPoStatus(taskId), 1000);
      }
    } catch (err: any) {
      setPoUploadResult({ message: "Failed to fetch status" });
      setPoUploadStatus("error");
      setIsPoUploading(false);
    }
  };

  const handlePoUpload = async () => {
    if (!poFile) return;

    setIsPoUploading(true);
    setPoUploadStatus("idle");
    setPoProgress(0);
    setPoProgressMessage("Starting upload...");

    const formData = new FormData();
    formData.append("file", poFile);

    try {
      const res = await api.post(`/admin/upload-pos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const taskId = res.data.task_id;
      pollPoStatus(taskId);
    } catch (err: any) {
      console.error(err);
      setPoUploadResult({ message: err.response?.data?.detail || "An unexpected error occurred during import." });
      setPoUploadStatus("error");
      setIsPoUploading(false);
    }
  };

  const pollAlternativeStatus = async (taskId: string) => {
    try {
      const res = await api.get(`/admin/upload-alternatives/status/${taskId}`);
      setAlternativeProgress(res.data.progress);
      setAlternativeProgressMessage(res.data.message);

      if (res.data.status === "completed") {
        setAlternativeUploadResult({
          message: res.data.message,
          pos_count: res.data.pos_count
        });
        setAlternativeUploadStatus("success");
        setIsAlternativeUploading(false);
      } else if (res.data.status === "failed") {
        setAlternativeUploadResult({ message: res.data.error || "Import failed" });
        setAlternativeUploadStatus("error");
        setIsAlternativeUploading(false);
      } else {
        // Continue polling
        setTimeout(() => pollAlternativeStatus(taskId), 1000);
      }
    } catch (err: any) {
      setAlternativeUploadResult({ message: "Failed to fetch status" });
      setAlternativeUploadStatus("error");
      setIsAlternativeUploading(false);
    }
  };

  const handleAlternativeUpload = async () => {
    if (!AlternativeFile) return;

    setIsAlternativeUploading(true);
    setAlternativeUploadStatus("idle");
    setAlternativeProgress(0);
    setAlternativeProgressMessage("Starting upload...");

    const formData = new FormData();
    formData.append("file", AlternativeFile);

    try {
      const res = await api.post(`/admin/upload-alternatives`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const taskId = res.data.task_id;
      pollAlternativeStatus(taskId);
    } catch (err: any) {
      console.error(err);
      setAlternativeUploadResult({ message: err.response?.data?.detail || "An unexpected error occurred during import." });
      setAlternativeUploadStatus("error");
      setIsAlternativeUploading(false);
    }
  };

  // Prediction Engine Actions
  const pollPredictStatus = async (taskId: string) => {
    try {
      const res = await api.get(`/admin/predict/status/${taskId}`);
      setPredictProgress(res.data.progress);
      setPredictMessage(res.data.message);

      if (res.data.status === "completed") {
        setPredictResult({
          message: res.data.message,
          predictions_count: res.data.predictions_count,
        });
        setPredictStatus("success");
        setIsPredicting(false);
      } else if (res.data.status === "failed") {
        setPredictResult({ message: res.data.error || "Prediction engine execution failed" });
        setPredictStatus("error");
        setIsPredicting(false);
      } else {
        // Continue polling
        setTimeout(() => pollPredictStatus(taskId), 1000);
      }
    } catch (err: any) {
      setPredictResult({ message: "Failed to fetch prediction status" });
      setPredictStatus("error");
      setIsPredicting(false);
    }
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    setPredictStatus("idle");
    setPredictResult(null);
    setPredictProgress(0);
    setPredictMessage("Initializing prediction engine...");

    try {
      const res = await api.post(`/admin/predict`);
      const taskId = res.data.task_id;
      pollPredictStatus(taskId);
    } catch (err: any) {
      console.error(err);
      setPredictResult({
        message: err.response?.data?.detail || "Failed to contact prediction service. Please ensure FastAPI is running.",
      });
      setPredictStatus("error");
      setIsPredicting(false);
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

            {/* PROGRESS BAR */}
            {isUploading && (
              <div className="space-y-2 mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex justify-between text-sm font-medium text-blue-700 dark:text-blue-300">
                  <span>{progressMessage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 dark:bg-blue-900/40 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

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

        {/* PURCHASE ORDERS IMPORT CARD */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Purchase Orders Import</CardTitle>
            <CardDescription>
              Upload your Purchase Orders Excel file (with sheet named "IND") to populate the database.
              This will overwrite all existing purchase orders in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* DROPZONE */}
            <div
              {...getPoRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                isPoDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-400 hover:bg-muted/50",
                poFile && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
              )}
            >
              <input {...getPoInputProps()} />

              {poFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{poFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(poFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                onClick={() => { setPoFile(null); setPoUploadStatus("idle"); setPoUploadResult(null); }}
                disabled={!poFile || isPoUploading}
              >
                Clear
              </Button>
              <Button
                onClick={handlePoUpload}
                disabled={!poFile || isPoUploading}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isPoUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <UploadCloud className="w-4 h-4" />
                    <span>Import Purchase Orders</span>
                  </div>
                )}
              </Button>
            </div>

            {/* PROGRESS BAR */}
            {isPoUploading && (
              <div className="space-y-2 mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex justify-between text-sm font-medium text-blue-700 dark:text-blue-300">
                  <span>{poProgressMessage}</span>
                  <span>{poProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 dark:bg-blue-900/40 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${poProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* STATUS MESSAGES */}
            {poUploadStatus === "success" && poUploadResult && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Import Successful</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-1">
                    {poUploadResult.message}. Imported {poUploadResult.pos_count} purchase orders.
                  </p>
                </div>
              </div>
            )}

            {poUploadStatus === "error" && poUploadResult && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Import Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {poUploadResult.message}
                  </p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* PART ALTERNATIVE IMPORT CARD */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Part Alternative Import</CardTitle>
            <CardDescription>
              Upload your Part Alternatives and the master Excel file (with sheet named "IND") to populate the database.
              This will overwrite all existing part alternatives in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* DROPZONE */}
            <div
              {...getAlternativeRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                isPoDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-400 hover:bg-muted/50",
                poFile && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
              )}
            >
              <input {...getAlternativeInputProps()} />

              {poFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{AlternativeFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(AlternativeFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                onClick={() => { setAlternativeFile(null); setAlternativeUploadStatus("idle"); setAlternativeUploadResult(null); }}
                disabled={!poFile || isPoUploading}
              >
                Clear
              </Button>
              <Button
                onClick={handleAlternativeUpload}
                disabled={!AlternativeFile || isAlternativeUploading}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isAlternativeUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <UploadCloud className="w-4 h-4" />
                    <span>Import Alternatives </span>
                  </div>
                )}
              </Button>
            </div>

            {/* PROGRESS BAR */}
            {isAlternativeUploading && (
              <div className="space-y-2 mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex justify-between text-sm font-medium text-blue-700 dark:text-blue-300">
                  <span>{AlternativeProgressMessage}</span>
                  <span>{AlternativeProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 dark:bg-blue-900/40 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${AlternativeProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* STATUS MESSAGES */}
            {AlternativeUploadStatus === "success" && AlternativeUploadResult && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Import Successful</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-1">
                    {AlternativeUploadResult.message}. Imported {AlternativeUploadResult.pos_count} purchase orders.
                  </p>
                </div>
              </div>
            )}

            {AlternativeUploadStatus === "error" && AlternativeUploadResult && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Import Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {AlternativeUploadResult.message}
                  </p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* DEMAND PREDICTION ENGINE CARD */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <span>Demand Prediction Engine</span>
            </CardTitle>
            <CardDescription>
              Execute the machine learning models (Double Exponential Smoothing, Holt-Winters, and TSB Intermittent) on your monthly consumption history to predict material requirements for the next 3 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-muted bg-muted/20">
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Run ML Forecasts</h4>
                <p className="text-xs text-muted-foreground max-w-md">
                  Updates 3-month predictions and reorder recommendations for all imported items. Overwrites prior prediction data.
                </p>
              </div>
              <Button
                onClick={handlePredict}
                disabled={isPredicting || isUploading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0"
              >
                {isPredicting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Brain className="w-4 h-4" />
                    <span>Run Prediction Engine</span>
                  </div>
                )}
              </Button>
            </div>

            {/* PREDICTION PROGRESS BAR */}
            {isPredicting && (
              <div className="space-y-2 mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex justify-between text-sm font-medium text-blue-700 dark:text-blue-300">
                  <span>{predictMessage}</span>
                  <span>{predictProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 dark:bg-blue-900/40 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${predictProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* PREDICTION STATUS MESSAGES */}
            {predictStatus === "success" && predictResult && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Prediction Completed</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-1">
                    {predictResult.message}. Generated forecasts for {predictResult.predictions_count} material codes.
                  </p>
                </div>
              </div>
            )}

            {predictStatus === "error" && predictResult && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Execution Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {predictResult.message}
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
