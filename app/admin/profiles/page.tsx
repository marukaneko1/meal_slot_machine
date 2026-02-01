'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { SlotCategory } from '@/lib/types';
import { SLOT_CATEGORIES, SLOT_CATEGORY_LABELS } from '@/lib/types';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Star,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Profile {
  id: string;
  name: string;
  rulesJson: string;
  isDefault: boolean;
  createdAt: string;
}

interface ProfileRules {
  categories: SlotCategory[];
  description?: string;
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categories: [...SLOT_CATEGORIES] as SlotCategory[],
    description: '',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      if (response.ok) {
        setProfiles(await response.json());
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadProfiles();
        setIsCreating(false);
        setFormData({
          name: '',
          categories: [...SLOT_CATEGORIES],
          description: '',
        });
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadProfiles();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProfiles();
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/profiles/${id}/default`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadProfiles();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const startEditing = (profile: Profile) => {
    const rules: ProfileRules = JSON.parse(profile.rulesJson);
    setEditingId(profile.id);
    setFormData({
      name: profile.name,
      categories: rules.categories || [...SLOT_CATEGORIES],
      description: rules.description || '',
    });
  };

  const toggleCategory = (category: SlotCategory) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  return (
    <div className="min-h-screen py-6 md:py-10">
      <div className="container-page max-w-4xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-1 flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              Profiles
            </h1>
            <p className="body-lg mt-2">
              Manage meal plan templates and category presets
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setIsCreating(true);
              setFormData({
                name: '',
                categories: [...SLOT_CATEGORIES],
                description: '',
              });
            }}
          >
            <Plus className="w-4 h-4" />
            New Profile
          </Button>
        </header>

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Create New Profile' : 'Edit Profile'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Profile Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Standard Weekly, Light Meals"
              />

              <Input
                label="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe this profile..."
              />

              <div>
                <label className="input-label mb-3 block">
                  Categories to Include
                </label>
                <div className="flex flex-wrap gap-2">
                  {SLOT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'chip-interactive',
                        formData.categories.includes(cat) && 'chip-selected'
                      )}
                    >
                      {SLOT_CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
                <p className="caption mt-2">
                  Selected: {formData.categories.length} of {SLOT_CATEGORIES.length} categories
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    editingId ? handleUpdate(editingId) : handleCreate()
                  }
                  disabled={
                    !formData.name.trim() || formData.categories.length === 0
                  }
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Save Changes' : 'Create Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profiles List */}
        <div className="space-y-3">
          {profiles.map((profile) => {
            const rules: ProfileRules = JSON.parse(profile.rulesJson);
            return (
              <Card key={profile.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="heading-4">{profile.name}</h3>
                        {profile.isDefault && (
                          <span className="chip bg-accent-subtle text-accent text-xs gap-1">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      {rules.description && (
                        <p className="body-sm mb-3">{rules.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {rules.categories?.map((cat) => (
                          <span
                            key={cat}
                            className={cn(
                              'chip text-xs',
                              cat.includes('chicken') || cat.includes('beef') ? 'chip-protein' :
                              cat.includes('veg') ? 'chip-vegetable' :
                              cat.includes('starch') ? 'chip-starch' :
                              cat === 'soup' ? 'chip-soup' : 'chip-dessert'
                            )}
                          >
                            {SLOT_CATEGORY_LABELS[cat]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!profile.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(profile.id)}
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(profile)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {!profile.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(profile.id)}
                          className="hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {profiles.length === 0 && (
            <div className="empty-state">
              <Users className="empty-state-icon" />
              <h3 className="empty-state-title">No profiles yet</h3>
              <p className="empty-state-description">
                Create a profile to define meal plan categories
              </p>
              <Button variant="primary" onClick={() => setIsCreating(true)} className="mt-4">
                <Plus className="w-4 h-4" />
                Create First Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
