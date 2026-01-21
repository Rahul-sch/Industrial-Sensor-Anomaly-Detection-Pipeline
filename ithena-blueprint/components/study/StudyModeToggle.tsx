'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import { BookOpen, Highlighter, StickyNote, Eye, EyeOff, Settings } from 'lucide-react';

interface StudyModeSettings {
  highlightKeyTerms: boolean;
  showDifficultyIndicators: boolean;
  enableNoteTaking: boolean;
  showAnnotations: boolean;
  compactMode: boolean;
}

interface StudyModeContextType {
  isStudyMode: boolean;
  settings: StudyModeSettings;
  toggleStudyMode: () => void;
  updateSettings: (updates: Partial<StudyModeSettings>) => void;
}

const DEFAULT_SETTINGS: StudyModeSettings = {
  highlightKeyTerms: true,
  showDifficultyIndicators: true,
  enableNoteTaking: true,
  showAnnotations: true,
  compactMode: false,
};

const StudyModeContext = createContext<StudyModeContextType | null>(null);

export function StudyModeProvider({ children }: { children: React.ReactNode }) {
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [settings, setSettings] = useState<StudyModeSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ithena-study-mode-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  const toggleStudyMode = useCallback(() => {
    setIsStudyMode((prev) => !prev);
  }, []);

  const updateSettings = useCallback((updates: Partial<StudyModeSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('ithena-study-mode-settings', JSON.stringify(newSettings));
      }
      return newSettings;
    });
  }, []);

  return (
    <StudyModeContext.Provider value={{ isStudyMode, settings, toggleStudyMode, updateSettings }}>
      {children}
    </StudyModeContext.Provider>
  );
}

export function useStudyMode() {
  const context = useContext(StudyModeContext);
  if (!context) {
    throw new Error('useStudyMode must be used within a StudyModeProvider');
  }
  return context;
}

interface StudyModeToggleProps {
  showSettings?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StudyModeToggle({
  showSettings = true,
  size = 'md',
  className = '',
}: StudyModeToggleProps) {
  const { isStudyMode, settings, toggleStudyMode, updateSettings } = useStudyMode();
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Main Toggle */}
        <button
          onClick={toggleStudyMode}
          className={`
            flex items-center gap-2 rounded-lg font-medium transition-all
            ${sizeClasses[size]}
            ${
              isStudyMode
                ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }
          `}
        >
          <BookOpen className={iconSizes[size]} />
          <span>Study Mode</span>
          {isStudyMode ? (
            <Eye className={`${iconSizes[size]} opacity-70`} />
          ) : (
            <EyeOff className={`${iconSizes[size]} opacity-50`} />
          )}
        </button>

        {/* Settings Button */}
        {showSettings && isStudyMode && (
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`
              p-2 rounded-lg transition-colors
              ${
                showSettingsPanel
                  ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                  : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }
            `}
          >
            <Settings className={iconSizes[size]} />
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettingsPanel && isStudyMode && (
        <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl shadow-lg z-50 animate-fade-in">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
            Study Mode Settings
          </h4>

          <div className="space-y-3">
            <SettingToggle
              icon={<Highlighter className="w-4 h-4" />}
              label="Highlight Key Terms"
              description="Highlight important terminology"
              checked={settings.highlightKeyTerms}
              onChange={(checked) => updateSettings({ highlightKeyTerms: checked })}
            />

            <SettingToggle
              icon={<Eye className="w-4 h-4" />}
              label="Difficulty Indicators"
              description="Show content difficulty levels"
              checked={settings.showDifficultyIndicators}
              onChange={(checked) => updateSettings({ showDifficultyIndicators: checked })}
            />

            <SettingToggle
              icon={<StickyNote className="w-4 h-4" />}
              label="Note Taking"
              description="Enable inline notes"
              checked={settings.enableNoteTaking}
              onChange={(checked) => updateSettings({ enableNoteTaking: checked })}
            />

            <SettingToggle
              icon={<BookOpen className="w-4 h-4" />}
              label="Show Annotations"
              description="Display HOW/WHY/CRITICAL markers"
              checked={settings.showAnnotations}
              onChange={(checked) => updateSettings({ showAnnotations: checked })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Setting toggle component
function SettingToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="text-[var(--foreground-muted)] group-hover:text-[var(--accent-cyan)] transition-colors mt-0.5">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        <p className="text-xs text-[var(--foreground-muted)]">{description}</p>
      </div>
      <div
        className={`
          relative w-10 h-6 rounded-full transition-colors cursor-pointer
          ${checked ? 'bg-[var(--accent-cyan)]' : 'bg-[var(--background-tertiary)]'}
        `}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`
            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </div>
    </label>
  );
}

// Compact toggle for headers
export function CompactStudyToggle() {
  const { isStudyMode, toggleStudyMode } = useStudyMode();

  return (
    <button
      onClick={toggleStudyMode}
      className={`
        p-2 rounded-lg transition-colors
        ${
          isStudyMode
            ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
            : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
        }
      `}
      title={isStudyMode ? 'Disable Study Mode' : 'Enable Study Mode'}
    >
      <BookOpen className="w-5 h-5" />
    </button>
  );
}

// Study mode indicator badge
export function StudyModeIndicator() {
  const { isStudyMode } = useStudyMode();

  if (!isStudyMode) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-full text-xs font-medium">
      <BookOpen className="w-3 h-3" />
      Study Mode
    </div>
  );
}

export default StudyModeToggle;
