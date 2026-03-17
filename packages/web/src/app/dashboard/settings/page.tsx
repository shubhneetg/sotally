'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const aiProviders = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'cohere', label: 'Cohere' },
];

// Placeholder data
const storedKeys = [
  { id: '1', provider: 'openai', label: 'Main key', maskedKey: 'sk-...3kF9', createdAt: '2026-02-15' },
  { id: '2', provider: 'anthropic', label: 'Claude key', maskedKey: 'sk-ant-...xQ2m', createdAt: '2026-03-01' },
];

export default function SettingsPage() {
  const [profileName, setProfileName] = useState('Jane Doe');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newKeyProvider, setNewKeyProvider] = useState('openai');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');

  const [notifImportant, setNotifImportant] = useState(true);
  const [notifMilestones, setNotifMilestones] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [notifDigest, setNotifDigest] = useState(true);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, API keys, and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-foreground mb-1.5">
              Name
            </label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <Input
              id="profile-email"
              value="jane@example.com"
              disabled
              className="opacity-60"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Contact support to change your email address.
            </p>
          </div>
          <div>
            <label htmlFor="avatar-url" className="block text-sm font-medium text-foreground mb-1.5">
              Avatar URL
            </label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button>Save Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-foreground mb-1.5">
              Current Password
            </label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1.5">
              Confirm New Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button>Update Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys (BYOM)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Bring Your Own Model — connect your own AI provider keys to save credits on tool executions.
            Keys are encrypted with AES-256-GCM and never exposed.
          </p>

          {/* Existing Keys */}
          {storedKeys.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Stored Keys</h4>
              {storedKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{key.provider}</Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">{key.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {key.maskedKey} &middot; Added {key.createdAt}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Key */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h4 className="text-sm font-medium text-foreground">Add New Key</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="key-provider" className="block text-xs font-medium text-muted-foreground mb-1">
                  Provider
                </label>
                <select
                  id="key-provider"
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  {aiProviders.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="key-label" className="block text-xs font-medium text-muted-foreground mb-1">
                  Label
                </label>
                <Input
                  id="key-label"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="e.g., Production key"
                />
              </div>
              <div>
                <label htmlFor="key-value" className="block text-xs font-medium text-muted-foreground mb-1">
                  API Key
                </label>
                <Input
                  id="key-value"
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm">Add Key</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Important updates"
            description="Security alerts, payment confirmations, and account changes"
            checked={notifImportant}
            onChange={setNotifImportant}
          />
          <ToggleRow
            label="Milestones"
            description="Creator milestones, usage achievements, and platform news"
            checked={notifMilestones}
            onChange={setNotifMilestones}
          />
          <ToggleRow
            label="Marketing"
            description="New features, promotions, and recommended tools"
            checked={notifMarketing}
            onChange={setNotifMarketing}
          />
          <ToggleRow
            label="Weekly digest"
            description="Weekly summary of your tool usage and credit activity"
            checked={notifDigest}
            onChange={setNotifDigest}
          />
          <div className="flex justify-end pt-2">
            <Button>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account, data, and credit balance. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete Account
            </Button>
          </div>

          {/* Confirmation Modal */}
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground">
                  Are you sure?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This will permanently delete your account, all stored data, API keys, and
                  any remaining credit balance. Outstanding creator earnings will be paid out
                  within 30 days. This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive">
                    Yes, Delete My Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 ${
          checked ? 'bg-accent' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
