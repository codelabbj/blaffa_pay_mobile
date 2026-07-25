"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useApi } from '@/lib/useApi';
import { Loader2, Edit, Save, X, User, Mail, Phone, Shield, Calendar, CheckCircle, XCircle, Lock } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { extractErrorMessages } from '@/components/ui/error-display';
import { getApiBaseUrl } from "@/lib/env-config"

interface UserProfile {
  uid: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  display_name: string;
  is_verified: boolean;
  contact_method: string;
  created_at: string;
  updated_at: string;
}

const baseUrl = getApiBaseUrl();

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const { toast } = useToast();
  const apiFetch = useApi();

  // Password Update State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Get token from localStorage
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || "";
  }

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const data = await apiFetch(`auth/profile/`);
        setProfile(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Erreur',
          description: 'Échec du chargement des données du profil',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast, router, token, apiFetch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setPasswordLoading(true);
    try {
      await apiFetch(`auth/password-update/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
        successMessage: 'Mot de passe mis à jour avec succès.',
      });
      // Only clear form after successful update
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      const backendError = extractErrorMessages(error) || 'Échec de la mise à jour du mot de passe';
      setPasswordError(backendError);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedProfile = await apiFetch(`auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
        }),
        successMessage: 'Profil mis à jour avec succès',
      });
      setProfile(updatedProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour du profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
          <Skeleton className="h-12 w-1/3 mb-6" />
          <div className="grid gap-3 sm:p-4 md:p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-lg text-body dark:text-bodydark"><span>Échec du chargement du profil. Veuillez réessayer plus tard.</span></p>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6 space-y-6">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <span>Mon profil</span>
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                <span>Gérez vos informations de compte et paramètres</span>
              </p>
            </div>
            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier le profil</span>
              </Button>
            ) : (
              <div className="space-x-2">
                <Button
                  onClick={() => setEditing(false)}
                  variant="outline"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>Annuler</span>
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <span>Sauvegarder</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Overview */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center gap-2 sm:gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100"><span>{profile.display_name}</span></div>
                <div className="text-body dark:text-bodydark2 mt-1">
                  <span>Membre depuis</span> <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid gap-3 sm:p-4 md:p-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span>Informations personnelles</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    {editing ? (
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <div className="text-gray-900 dark:text-gray-100 font-medium"><span>{profile.first_name}</span></div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom de famille</Label>
                    {editing ? (
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <div className="text-gray-900 dark:text-gray-100 font-medium"><span>{profile.last_name}</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-strokedark">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Mail className="h-4 w-4 text-meta-3 dark:text-green-300" />
                  </div>
                  <span>Informations de contact</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-bodydark">Adresse e-mail</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-gray-100 font-medium"><span>{profile.email}</span></span>
                      {profile.email_verified && <Badge className="bg-green-100 text-green-800"><span>Vérifié</span></Badge>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-bodydark">Numéro de téléphone</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-gray-100 font-medium"><span>{profile.phone}</span></span>
                      {profile.phone_verified && <Badge className="bg-green-100 text-green-800"><span>Vérifié</span></Badge>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-strokedark">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                    <Calendar className="h-4 w-4 text-primary dark:text-secondary" />
                  </div>
                  <span>Informations du compte</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-bodydark">ID utilisateur</div>
                    <div className="flex items-center space-x-2 font-mono text-sm bg-gray-50 dark:bg-boxdark-2 p-2 rounded border border-stroke dark:border-strokedark">
                      <span className="truncate"><span>{profile.uid}</span></span>
                      <CopyButton value={profile.uid} className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-bodydark">Dernière mise à jour</div>
                    <div className="text-gray-900 dark:text-gray-100 p-2">
                      <span>{new Date(profile.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Lock className="h-4 w-4 text-red-600 dark:text-red-300" />
              </div>
              <span><span>Sécurité</span></span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modifier le mot de passe</h3>

              <div className="space-y-2">
                <Label htmlFor="old_password">Mot de passe actuel</Label>
                <Input
                  id="old_password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  minLength={0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_new_password">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm_new_password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  minLength={0}
                  required
                />
              </div>

              {passwordError && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <span>{passwordError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={passwordLoading}
                className="bg-primary hover:bg-primary text-white"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <span>Mettre à jour le mot de passe</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
