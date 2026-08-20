import React, { useState, useEffect, useMemo, memo } from 'react';
import { useToast } from '../../context/ToastContext.js';
import { Plus, Trash2, Edit, Copy, FileText, Loader2, Sparkles, Save, RotateCcw, X, Search, Clock, Video } from 'lucide-react';

interface EpisodeTemplate {
  id: string;
  name: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  subtitles: { language: string; label: string; url: string }[];
  skipIntroStart?: number;
  skipIntroEnd?: number;
  skipOutroStart?: number;
  createdAt: string;
  updatedAt: string;
  useCount: number;
}

interface EpisodeTemplatesProps {
  onClose: () => void;
}

const EpisodeTemplates = memo(function EpisodeTemplates({ onClose }: EpisodeTemplatesProps) {
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<EpisodeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EpisodeTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('65 mins');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formSubLang, setFormSubLang] = useState('en');
  const [formSubLabel, setFormSubLabel] = useState('English');
  const [formSubUrl, setFormSubUrl] = useState('/sample-sub-en.vtt');
  const [formSkipIntroStart, setFormSkipIntroStart] = useState('');
  const [formSkipIntroEnd, setFormSkipIntroEnd] = useState('');
  const [formSkipOutroStart, setFormSkipOutroStart] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('episode_templates');
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch {
        setTemplates([]);
      }
    }
    setLoading(false);
  }, []);

  const saveTemplates = (newTemplates: EpisodeTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('episode_templates', JSON.stringify(newTemplates));
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDuration('65 mins');
    setFormVideoUrl('');
    setFormThumbnail('');
    setFormSubLang('en');
    setFormSubLabel('English');
    setFormSubUrl('/sample-sub-en.vtt');
    setFormSkipIntroStart('');
    setFormSkipIntroEnd('');
    setFormSkipOutroStart('');
    setEditingTemplate(null);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      showToast('Template name is required', 'error');
      return;
    }

    const subtitles = formSubUrl ? [{ language: formSubLang, label: formSubLabel, url: formSubUrl }] : [];

    if (editingTemplate) {
      // Update existing
      const updated: EpisodeTemplate = {
        ...editingTemplate,
        name: formName.trim(),
        description: formDescription.trim(),
        duration: formDuration,
        videoUrl: formVideoUrl,
        thumbnail: formThumbnail,
        subtitles,
        skipIntroStart: formSkipIntroStart ? parseInt(formSkipIntroStart) : undefined,
        skipIntroEnd: formSkipIntroEnd ? parseInt(formSkipIntroEnd) : undefined,
        skipOutroStart: formSkipOutroStart ? parseInt(formSkipOutroStart) : undefined,
        updatedAt: new Date().toISOString(),
      };
      saveTemplates(templates.map(t => t.id === editingTemplate.id ? updated : t));
      showToast(`Template "${formName}" updated`, 'success');
    } else {
      // Create new
      const newTemplate: EpisodeTemplate = {
        id: `tpl_${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        duration: formDuration,
        videoUrl: formVideoUrl,
        thumbnail: formThumbnail,
        subtitles,
        skipIntroStart: formSkipIntroStart ? parseInt(formSkipIntroStart) : undefined,
        skipIntroEnd: formSkipIntroEnd ? parseInt(formSkipIntroEnd) : undefined,
        skipOutroStart: formSkipOutroStart ? parseInt(formSkipOutroStart) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        useCount: 0,
      };
      saveTemplates([newTemplate, ...templates]);
      showToast(`Template "${formName}" created`, 'success');
    }
    resetForm();
    setShowCreate(false);
  };

  const handleEdit = (template: EpisodeTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description);
    setFormDuration(template.duration);
    setFormVideoUrl(template.videoUrl);
    setFormThumbnail(template.thumbnail);
    setFormSubLang(template.subtitles[0]?.language || 'en');
    setFormSubLabel(template.subtitles[0]?.label || 'English');
    setFormSubUrl(template.subtitles[0]?.url || '/sample-sub-en.vtt');
    setFormSkipIntroStart(template.skipIntroStart?.toString() || '');
    setFormSkipIntroEnd(template.skipIntroEnd?.toString() || '');
    setFormSkipOutroStart(template.skipOutroStart?.toString() || '');
    setShowCreate(true);
  };

  const handleDuplicate = (template: EpisodeTemplate) => {
    const duplicated: EpisodeTemplate = {
      ...template,
      id: `tpl_${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      useCount: 0,
    };
    saveTemplates([duplicated, ...templates]);
    showToast(`Template duplicated as "${duplicated.name}"`, 'success');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this template permanently?')) return;
    saveTemplates(templates.filter(t => t.id !== id));
    showToast('Template deleted', 'info');
  };

  const handleUseTemplate = (template: EpisodeTemplate) => {
    // Store selected template for use in AddEpisode
    localStorage.setItem('selected_episode_template', JSON.stringify(template));
    // Increment use count
    saveTemplates(templates.map(t => t.id === template.id ? { ...t, useCount: t.useCount + 1 } : t));
    showToast(`Template "${template.name}" loaded for new episode`, 'success');
    onClose();
  };

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const sortedTemplates = useMemo(() => 
    [...filteredTemplates].sort((a, b) => b.useCount - a.useCount || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [filteredTemplates]
  );

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Episode Templates
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreate || editingTemplate) && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800 animate-slide-down max-h-[70vh] overflow-y-auto">
          <h3 className="font-semibold text-white">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
          
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Template Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Standard K-Drama Episode"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-400"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              placeholder="When to use this template..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Default Duration</label>
              <input
                type="text"
                placeholder="e.g. 65 mins"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-400"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Default Video URL</label>
              <input
                type="text"
                placeholder="https://... (optional default)"
                value={formVideoUrl}
                onChange={(e) => setFormVideoUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Default Thumbnail URL</label>
            <input
              type="text"
              placeholder="https://... (optional)"
              value={formThumbnail}
              onChange={(e) => setFormThumbnail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-400"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <label className="font-semibold text-slate-300 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Default Subtitles
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Lang (en, kr, es)"
                value={formSubLang}
                onChange={(e) => setFormSubLang(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 outline-none"
              />
              <input
                type="text"
                placeholder="Label (English)"
                value={formSubLabel}
                onChange={(e) => setFormSubLabel(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 outline-none"
              />
              <input
                type="text"
                placeholder="Subtitle URL"
                value={formSubUrl}
                onChange={(e) => setFormSubUrl(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 outline-none"
              />
            </div>
          </div>

          <details className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <summary className="font-semibold text-slate-300 cursor-pointer">Advanced: Skip Timings (seconds)</summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 text-xs">Intro Start</label>
                <input type="number" min={0} placeholder="0" value={formSkipIntroStart} onChange={(e) => setFormSkipIntroStart(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 outline-none text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 text-xs">Intro End</label>
                <input type="number" min={0} placeholder="90" value={formSkipIntroEnd} onChange={(e) => setFormSkipIntroEnd(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 outline-none text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 text-xs">Outro Start</label>
                <input type="number" min={0} placeholder="3600" value={formSkipOutroStart} onChange={(e) => setFormSkipOutroStart(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 outline-none text-xs" />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => { resetForm(); setShowCreate(false); }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingTemplate ? 'Update' : 'Create'} Template
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search templates by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Templates Grid */}
      {sortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Templates Yet</h3>
          <p className="text-slate-400 text-sm mb-4">Create templates to speed up episode creation with consistent settings</p>
          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold text-sm flex items-center gap-2 mx-auto shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-4 h-4" /> Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate">{template.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{template.description || 'No description'}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Used {template.useCount}x
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{template.duration}</span>
                </div>
                {template.skipIntroStart !== undefined && template.skipIntroEnd !== undefined && (
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Skip: {template.skipIntroStart}s–{template.skipIntroEnd}s</span>
                  </div>
                )}
                {template.videoUrl && (
                  <div className="flex items-center gap-2 truncate">
                    <Video className="w-3.5 h-3.5" />
                    <span className="truncate">Has default video</span>
                  </div>
                )}
                {template.thumbnail && (
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">Has default thumbnail</span>
                  </div>
                )}
                {template.subtitles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{template.subtitles.map(s => s.label).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/30"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Use
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Edit template"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Duplicate template"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                  title="Delete template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

EpisodeTemplates.displayName = 'EpisodeTemplates';

export { EpisodeTemplates };