"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Mail, Lock, Key, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";

interface PasswordResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIdentifier?: string;
  onSuccess?: (msg: string) => void;
}

export default function PasswordResetModal({ open, onOpenChange, initialIdentifier = "", onSuccess }: PasswordResetModalProps) {
  const [step, setStep] = useState<"init"|"code">("init");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState("");

  // Simulate API call
  const fakeApi = (payload: any, response: any, delay = 800) => new Promise(res => setTimeout(() => res(response), delay));

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const resp = await fakeApi(
        { identifier },
        {
          message: "Code de réinitialisation en cours d'envoi par email.",
          status: "sending",
          contact_method: "email",
          task_id: "c6c19cec-c243-48e7-981c-c4442b632636"
        }
      );
      setMessage((resp as any).message);
      setTaskId((resp as any).task_id);
      setStep("code");
    } catch (e) {
      setError("Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const resp = await fakeApi(
        { identifier, code, new_password: newPassword },
        { message: "Mot de passe réinitialisé avec succès." }
      );
      setMessage((resp as any).message);
      if (onSuccess) onSuccess((resp as any).message);
      setTimeout(() => {
        onOpenChange(false);
        setStep("init");
        setIdentifier(initialIdentifier);
        setCode("");
        setNewPassword("");
        setMessage("");
        setError("");
      }, 1200);
    } catch (e) {
      setError("Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("init");
    setCode("");
    setNewPassword("");
    setMessage("");
    setError("");
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("init");
      setIdentifier(initialIdentifier);
      setCode("");
      setNewPassword("");
      setMessage("");
      setError("");
      setTaskId("");
    }
  }, [open, initialIdentifier]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-boxdark border-0 shadow-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <span>Reset Password</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className={`flex items-center space-x-2 ${step === "init" ? "text-blue-600" : "text-bodydark2"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "init" ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-meta-4"}`}>
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Send Code</span>
            </div>
            <div className={`w-8 h-0.5 ${step === "code" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}></div>
            <div className={`flex items-center space-x-2 ${step === "code" ? "text-blue-600" : "text-bodydark2"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "code" ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-meta-4"}`}>
                <Key className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Reset</span>
            </div>
          </div>

          {/* Step 1: Send Reset Code */}
          {step === "init" && (
            <form onSubmit={handleInitiate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-bodydark2" />
                  </div>
                  <Input
                    placeholder="Enter your email or username"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Reset Code...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Code
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Enter Code and New Password */}
          {step === "code" && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="border-stroke dark:border-strokedark"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="text-sm text-body dark:text-bodydark2">
                  Code sent to: <span className="font-medium">{identifier}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  Reset Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-bodydark2" />
                  </div>
                  <Input
                    placeholder="Enter the reset code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                    className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-bodydark2" />
                  </div>
                  <Input
                    placeholder="Enter your new password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !code.trim() || !newPassword.trim()}
                className="w-full bg-meta-3 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Success Message */}
          {message && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-meta-3" />
                <span className="text-sm text-green-700 dark:text-green-300">{message}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 