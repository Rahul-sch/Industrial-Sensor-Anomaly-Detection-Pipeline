'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  Download,
  Edit3,
  Save,
  X,
  Clock,
  Tag,
  Sparkles,
} from 'lucide-react';
import type { StudyNote } from '@/lib/types';

interface NotesPanelProps {
  contentId: string;
  contentTitle?: string;
  onCreateFlashcard?: (front: string, back: string) => void;
  className?: string;
}

export function NotesPanel({
  contentId,
  contentTitle = 'Content',
  onCreateFlashcard,
  className = '',
}: NotesPanelProps) {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`ithena-notes-${contentId}`);
    if (stored) {
      setNotes(JSON.parse(stored));
    }
  }, [contentId]);

  // Save notes to localStorage
  const saveNotes = useCallback(
    (newNotes: StudyNote[]) => {
      localStorage.setItem(`ithena-notes-${contentId}`, JSON.stringify(newNotes));
      setNotes(newNotes);
    },
    [contentId]
  );

  // Add new note
  const handleAddNote = useCallback(() => {
    if (!newNoteContent.trim()) return;

    const note: StudyNote = {
      id: `note-${Date.now()}`,
      contentId,
      content: newNoteContent.trim(),
      tags: newNoteTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveNotes([note, ...notes]);
    setNewNoteContent('');
    setNewNoteTags([]);
    setIsAddingNote(false);
  }, [contentId, newNoteContent, newNoteTags, notes, saveNotes]);

  // Update note
  const handleUpdateNote = useCallback(
    (noteId: string, content: string, tags: string[]) => {
      const updatedNotes = notes.map((n) =>
        n.id === noteId
          ? { ...n, content, tags, updatedAt: new Date().toISOString() }
          : n
      );
      saveNotes(updatedNotes);
      setEditingNoteId(null);
    },
    [notes, saveNotes]
  );

  // Delete note
  const handleDeleteNote = useCallback(
    (noteId: string) => {
      saveNotes(notes.filter((n) => n.id !== noteId));
    },
    [notes, saveNotes]
  );

  // Add tag
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !newNoteTags.includes(tag)) {
      setNewNoteTags([...newNoteTags, tag]);
      setTagInput('');
    }
  }, [tagInput, newNoteTags]);

  // Remove tag
  const handleRemoveTag = useCallback((tag: string) => {
    setNewNoteTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // Export notes to markdown
  const handleExport = useCallback(() => {
    const markdown = notes
      .map((n) => {
        const tags = n.tags.length > 0 ? `\nTags: ${n.tags.join(', ')}` : '';
        return `## Note (${new Date(n.createdAt).toLocaleDateString()})\n\n${n.content}${tags}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([`# Notes for ${contentTitle}\n\n${markdown}`], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${contentId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [notes, contentId, contentTitle]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--background-tertiary)]">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-[var(--accent-yellow)]" />
          <h3 className="font-semibold text-[var(--foreground)]">Notes</h3>
          <span className="text-xs text-[var(--foreground-muted)]">
            ({notes.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {notes.length > 0 && (
            <button
              onClick={handleExport}
              className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              title="Export notes"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsAddingNote(true)}
            className="p-1.5 bg-[var(--accent-yellow)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
            title="Add note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="p-4 border-b border-[var(--background-tertiary)] bg-[var(--background-secondary)]">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write your note..."
            className="w-full p-3 bg-[var(--background)] border border-[var(--background-tertiary)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none focus:outline-none focus:border-[var(--accent-yellow)]"
            rows={4}
            autoFocus
          />

          {/* Tags */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tags..."
                className="flex-1 text-sm bg-transparent border-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
              />
            </div>
            {newNoteTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {newNoteTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--background-tertiary)] text-[var(--foreground-muted)] rounded-full text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[var(--accent-red)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => {
                setIsAddingNote(false);
                setNewNoteContent('');
                setNewNoteTags([]);
              }}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-yellow)] text-[var(--background)] rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 && !isAddingNote ? (
          <div className="text-center py-8">
            <StickyNote className="w-10 h-10 mx-auto mb-3 text-[var(--foreground-muted)] opacity-50" />
            <p className="text-sm text-[var(--foreground-muted)]">No notes yet</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Click + to add your first note
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingNoteId === note.id}
              onEdit={() => setEditingNoteId(note.id)}
              onSave={(content, tags) => handleUpdateNote(note.id, content, tags)}
              onCancel={() => setEditingNoteId(null)}
              onDelete={() => handleDeleteNote(note.id)}
              onCreateFlashcard={onCreateFlashcard}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Note Card Component
function NoteCard({
  note,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onCreateFlashcard,
}: {
  note: StudyNote;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (content: string, tags: string[]) => void;
  onCancel: () => void;
  onDelete: () => void;
  onCreateFlashcard?: (front: string, back: string) => void;
}) {
  const [editContent, setEditContent] = useState(note.content);
  const [editTags, setEditTags] = useState(note.tags);

  if (isEditing) {
    return (
      <div className="p-3 bg-[var(--background-secondary)] rounded-lg border border-[var(--accent-yellow)]">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-2 bg-[var(--background)] border border-[var(--background-tertiary)] rounded text-sm text-[var(--foreground)] resize-none focus:outline-none"
          rows={4}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-[var(--foreground-muted)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editContent, editTags)}
            className="px-3 py-1 bg-[var(--accent-yellow)] text-[var(--background)] rounded text-sm"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-[var(--background-secondary)] rounded-lg group hover:border-[var(--accent-yellow)] border border-transparent transition-colors">
      <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
        {note.content}
      </p>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-[var(--background-tertiary)] text-[var(--foreground-muted)] rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--background-tertiary)]">
        <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
          <Clock className="w-3 h-3" />
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCreateFlashcard && (
            <button
              onClick={() => onCreateFlashcard(note.content.slice(0, 100), note.content)}
              className="p-1 text-[var(--foreground-muted)] hover:text-[var(--accent-purple)]"
              title="Create flashcard from note"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--accent-cyan)]"
            title="Edit note"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--accent-red)]"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact inline note input
export function QuickNoteInput({
  contentId,
  onSave,
  className = '',
}: {
  contentId: string;
  onSave?: (note: StudyNote) => void;
  className?: string;
}) {
  const [content, setContent] = useState('');

  const handleSave = useCallback(() => {
    if (!content.trim()) return;

    const note: StudyNote = {
      id: `note-${Date.now()}`,
      contentId,
      content: content.trim(),
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const stored = localStorage.getItem(`ithena-notes-${contentId}`);
    const notes = stored ? JSON.parse(stored) : [];
    localStorage.setItem(`ithena-notes-${contentId}`, JSON.stringify([note, ...notes]));

    onSave?.(note);
    setContent('');
  }, [content, contentId, onSave]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder="Quick note..."
        className="flex-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent-yellow)]"
      />
      <button
        onClick={handleSave}
        disabled={!content.trim()}
        className="p-2 bg-[var(--accent-yellow)] text-[var(--background)] rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default NotesPanel;
