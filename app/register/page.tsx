"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2, Lock, Mail, User, AlertCircle, CheckCircle2,
  ChevronLeft, Shield, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { user, registerUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield className="w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-muted-foreground max-w-xs">
            Only administrators can create new user accounts.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setSuccess(`Account for ${formData.email} created successfully!`);

      setFormData({
        firstName: "", lastName: "", email: "",
        password: "", confirmPassword: "", role: "user"
      });
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to register user. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 pt-16 pb-12 px-4"> {/* Added pt-16 for top spacing */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f630_1px,transparent_1px)] bg-[length:20px_20px] dark:bg-[radial-gradient(#3b82f610_1px,transparent_1px)]" />

      <div className="max-w-2xl mx-auto relative">
        <button
          onClick={() => router.push("/")}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm hover:shadow transition-all hover:-translate-x-0.5 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <Card className="border border-white/60 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl mt-8">
          {/* HEADER */}
          <div className="flex flex-col items-center pt-10 pb-2">
            <div className="relative w-40 h-14 mb-2">
              <Image
                src="/images/IFB.png"
                alt="IFB Logo"
                fill
                className="object-contain dark:invert"
                priority
              />
            </div>
            <p className="text-xs tracking-[3px] uppercase text-zinc-500 dark:text-zinc-400 font-medium">
              Materials • Inventory OS
            </p>
          </div>

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">Create New User</CardTitle>
            <CardDescription className="text-base mt-1">
              Add a new team member to the Materials Dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NAME FIELDS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Urvesh"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Vernekar"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="urvesh_vernekar@ifbglobal.com"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* PASSWORD STRENGTH */}
                {formData.password && (
                  <div className="flex items-center gap-3 text-xs mt-2">
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`font-medium ${passwordStrength.score >= 3 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* PASSWORD MATCH CHECK */}
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-xs mt-2 pl-1">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="font-medium text-red-600 dark:text-red-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ROLE SELECTION */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "user", label: "User", desc: "Standard access" },
                    { value: "admin", label: "Admin", desc: "Full access" },
                  ].map((r) => (
                    <label
                      key={r.value}
                      className={`cursor-pointer border rounded-2xl p-4 transition-all hover:border-blue-500 ${formData.role === r.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-zinc-200 dark:border-zinc-800'
                        }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={formData.role === r.value}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{r.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 text-base font-semibold rounded-2xl mt-4 shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all active:scale-[0.985]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create User Account"
                )}
              </Button>

              {success && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p>{success}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}