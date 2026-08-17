import React, { useState, useMemo, useCallback, memo } from 'react';
import { Drama } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { SearchableDramaSelect } from './SearchableDramaSelect.js';
import { Plus, Upload, Loader2, Trash2, Sparkles, X, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024; // 20GB (media server supports 2GB+ files)

type RowStatus = 'pending' | 'uploading' | 'uploaded' | 'saving' | 'done' | 'error';

interface BulkRow {
  id: string;
  dramaId: string;
  episodeNumber: string;
  title: string;
  file: File | null;
  videoUrl: string;
  status: RowStatus;
  progress: number;
  error: string;
}

interface BulkEpisodeGeneratorProps {
  dramas: Drama[];
  onSuccess: () => void;
  onCancel: () => void;
}

let rowCounter = 0;
const newRowId = () => `row_${Date.now()}_${rowCounter++}`;

function extractEpisodeNumberFromFilename(name: string): number | null {
  const base = name.replace(/\.[^.]+$/, '');
  const patterns = [
    /(?:ep|episode|e|part|p)[\s._-]?(\d{1,3})/i,
    /(?:^|[\s._-])v?(\d{1,3})(?:[\s._-]v?\d{1,3})*$/i,
    /(?:^|[^0-9])(\d{1,3})(?:[^0-9]|$)/
  ];
  for (const pattern of patterns) {
    const m = base.match(pattern);
    if (m && m[1]) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 999) return n;
    }
  }
  return null;
}

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^episode \d+$/i.test(base) || /^ep \d+$/i.test(base)) {
    return base.replace(/^(?:ep|episode)\s(\d+)$/i, 'Episode $1');
  }
  return base || 'Untitled Episode';
}

function isMp4(file: File): boolean {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  return file.type === 'video/mp4' || ext === '.mp4';
}

const BulkEpisodeGenerator = memo(function BulkEpisodeGenerator({
  dramas,
  onSuccess,
  onCancel,
}: BulkEpisodeGeneratorProps) {
  const { showToast } = useToast();

  const [rows, setRows] = useState<BulkRow[]>(() => [
    { id: newRowId(), dramaId: '', episodeNumber: '1', title: 'Episode 1', file: null, videoUrl: '', status: 'pending', progress: 0, error: '' }
  ]);
  const [busy, setBusy] = useState(false);

  const patchRow = useCallback((id: string, patch: Partial<BulkRow>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => {
      const nextNum = prev.reduce((max, r) => {
        const n = parseInt(r.episodeNumber, 10);
        return Number.isFinite(n) && n > max ? n : max;
      }, 0) + 1;
      return [
        ...prev,
        { id: newRowId(), dramaId: '', episodeNumber: String(nextNum), title: `Episode ${nextNum}`, file: null, videoUrl: '', status: 'pending', progress: 0, error: '' }
      ];
    });
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev));
  }, []);

  const handleFilePicked = useCallback((rowId: string, file: File | null) => {
    if (!file) return;
    if (!isMp4(file)) {
      showToast(`"${file.name}" is not an MP4 file`, 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`"${file.name}" exceeds the 20GB size limit`, 'error');
      return;
    }
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const epFromName = extractEpisodeNumberFromFilename(file.name);
      const patch: Partial<BulkRow> = { file, status: 'pending', progress: 0, error: '' };
      if (epFromName !== null) {
        patch.episodeNumber = String(epFromName);
        patch.title = `Episode ${epFromName}`;
      } else if (!r.title || /^Episode \d+$/.test(r.title)) {
        patch.title = titleFromFilename(file.name);
      }
      return { ...r, ...patch };
    }));
  }, [showToast]);

  const uploadOne = useCallback(async (row: BulkRow): Promise<{ ok: boolean; url: string }> => {
    if (!row.file) return { ok: true, url: row.videoUrl };
    try {
      const res = await adminService.uploadFile(row.file, p => patchRow(row.id, { progress: p }), `dramas/${row.dramaId}/episodes/episode-${row.episodeNumber}`);
      patchRow(row.id, { videoUrl: res.url, status: 'uploaded', progress: 100 });
      return { ok: true, url: res.url };
    } catch (err: any) {
      patchRow(row.id, { status: 'error', error: err.message || 'Upload failed' });
      return { ok: false, url: '' };
    }
  }, [patchRow]);

  const handleUploadAll = useCallback(async () => {
    const missingDrama = rows.some(r => !r.dramaId);
    const missingFile = rows.some(r => !r.file && !r.videoUrl);
    if (missingDrama) {
      showToast('Select a drama for every episode row', 'error');
      return;
    }
    if (missingFile) {
      showToast('Attach an MP4 file for every episode row', 'error');
      return;
    }

    setBusy(true);

    // Phase 1: upload video files (per-row progress, failures don't block others)
    const payload: { dramaId: string; episodeNumber?: number; title: string; videoUrl: string }[] = [];
    const rowIds: string[] = [];
    for (const row of rows) {
      if (row.videoUrl) {
        payload.push({
          dramaId: row.dramaId,
          episodeNumber: parseInt(row.episodeNumber, 10) || undefined,
          title: row.title.trim() || `Episode ${row.episodeNumber}`,
          videoUrl: row.videoUrl,
        });
        rowIds.push(row.id);
        continue;
      }
      patchRow(row.id, { status: 'uploading', progress: 0, error: '' });
      const { ok, url } = await uploadOne(row);
      if (ok && url) {
        payload.push({
          dramaId: row.dramaId,
          episodeNumber: parseInt(row.episodeNumber, 10) || undefined,
          title: row.title.trim() || `Episode ${row.episodeNumber}`,
          videoUrl: url,
        });
        rowIds.push(row.id);
      }
    }

    // Phase 2: bulk-save episode metadata (single request)
    let created = 0;
    if (payload.length > 0) {
      try {
        const res = await dramaService.bulkCreateEpisodes(payload);
        created = res.created || 0;
        setRows(prev => prev.map(r => {
          const resIdx = rowIds.indexOf(r.id);
          const result = resIdx >= 0 ? res.results?.find((item: any) => item.index === resIdx) : undefined;
          if (result?.success) {
            return { ...r, status: 'done', progress: 100, error: '' };
          }
          return { ...r, status: 'error', error: result?.message || 'Failed to save episode' };
        }));
      } catch (err: any) {
        showToast(err.message || 'Failed to save episodes', 'error');
        setRows(prev => prev.map(r => (rowIds.includes(r.id) && r.status !== 'done' ? { ...r, status: 'error', error: 'Save failed' } : r)));
      }
    }

    setBusy(false);
    if (created > 0) {
      showToast(`${created} of ${rows.length} episodes created successfully!`, 'success');
      onSuccess();
    }
  }, [rows, uploadOne, patchRow, showToast, onSuccess]);

  const overallProgress = useMemo(() => {
    if (rows.length === 0) return 0;
    const total = rows.reduce((acc, r) => {
      if (r.status === 'done') return acc + 100;
      if (r.status === 'uploaded' || r.status === 'saving') return acc + 90;
      if (r.status === 'uploading') return acc + r.progress * 0.7;
      if (r.status === 'error') return acc + 0;
      return acc;
    }, 0);
    return Math.round(total / rows.length);
  }, [rows]);

  const activeCount = rows.filter(r => r.status === 'done').length;

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-5 max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Bulk Episode Upload
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            One drama per episode row — exactly {rows.length} {rows.length === 1 ? 'drama' : 'dramas'} can be selected. Episode numbers auto-assign by order or from file names (ep1.mp4 → Episode 1).
          </p>
        </div>
        <button onClick={onCancel} disabled={busy} className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-50">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Overall progress */}
      {(busy || activeCount > 0) && (
        <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Overall progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500">
            {activeCount} of {rows.length} episodes completed
            {busy && <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-cyan-400" />}
          </div>
        </div>
      )}

      {/* Episode rows */}
      <div className="space-y-3">
        <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          <div className="col-span-1">Sr.</div>
          <div className="col-span-3">Drama *</div>
          <div className="col-span-1">Ep #</div>
          <div className="col-span-3">Title</div>
          <div className="col-span-3">Video File (MP4, max 2GB)</div>
          <div className="col-span-1">Status</div>
        </div>

        {rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-12 gap-3 items-start rounded-xl bg-slate-950/60 border border-slate-800 p-3">
            <div className="col-span-1 pt-2.5 text-slate-500 font-mono text-xs">{index + 1}</div>

            <div className="col-span-11 md:col-span-3 space-y-1 relative">
              <SearchableDramaSelect
                dramas={dramas}
                value={row.dramaId}
                onChange={(dramaId) => {
                  patchRow(row.id, { dramaId, error: '' });
                  if (!row.title || /^Episode \d+$/.test(row.title)) {
                    const drama = dramas.find(d => d.id === dramaId);
                    if (drama) {
                      const nextEp = (drama.episodeCount || 0) + 1;
                      patchRow(row.id, { episodeNumber: String(nextEp), title: `Episode ${nextEp}` });
                    }
                  }
                }}
                placeholder="Choose drama..."
                label=""
                showEpisodeCount
              />
            </div>

            <div className="col-span-3 md:col-span-1 pt-0.5">
              <input
                type="number"
                min={1}
                value={row.episodeNumber}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  patchRow(row.id, { episodeNumber: e.target.value, title: Number.isFinite(n) && n >= 1 ? `Episode ${n}` : row.title });
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-cyan-500 text-xs"
                title="Episode number — auto-assigned, override manually"
              />
            </div>

            <div className="col-span-9 md:col-span-3 pt-0.5">
              <input
                type="text"
                value={row.title}
                onChange={(e) => patchRow(row.id, { title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-cyan-500 text-xs"
                placeholder="Episode title"
              />
            </div>

            <div className="col-span-9 md:col-span-3 pt-0.5 space-y-1.5">
              {row.videoUrl && row.status !== 'pending' ? (
                <div className="flex items-center gap-2">
                  <video
                    src={row.videoUrl}
                    controls
                    preload="metadata"
                    className="h-14 w-20 rounded-lg bg-black object-contain border border-slate-700"
                  />
                  <a
                    href={row.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-medium"
                    title="Open video in new tab"
                  >
                    <PlayCircle className="w-4 h-4" /> Play
                  </a>
                </div>
              ) : (
                <label
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed cursor-pointer text-xs font-semibold transition-colors ${
                    row.file
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'
                      : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                  } ${busy && row.status === 'uploading' ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {row.file ? row.file.name : 'Upload MP4'}
                  <input
                    type="file"
                    accept="video/mp4,.mp4"
                    disabled={busy && row.status === 'uploading'}
                    onChange={(e) => handleFilePicked(row.id, e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
              {row.status === 'uploading' && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${row.progress}%` }} />
                  </div>
                  <span className="text-[10px] text-cyan-400">{row.progress}% uploaded</span>
                </div>
              )}
              {row.status === 'error' && (
                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {row.error || 'Upload failed'}
                </p>
              )}
            </div>

            <div className="col-span-2 md:col-span-1 pt-0.5 flex items-start justify-between md:justify-start">
              <StatusChip status={row.status} />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={busy || rows.length <= 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:pointer-events-none ml-1"
                aria-label="Remove episode row"
                title="Remove row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        disabled={busy || rows.length >= 100}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
      >
        <Plus className="w-4 h-4" /> Add Another Episode
      </button>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUploadAll}
          disabled={busy}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading & Saving...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload All ({rows.length})
            </>
          )}
        </button>
      </div>
    </div>
  );
});

const StatusChip = memo(function StatusChip({ status }: { status: RowStatus }) {
  const styles: Record<RowStatus, { cls: string; text: string; Icon: any }> = {
    pending: { cls: 'bg-slate-800 text-slate-400', text: 'Pending', Icon: null },
    uploading: { cls: 'bg-cyan-500/15 text-cyan-400', text: 'Uploading', Icon: Loader2 },
    uploaded: { cls: 'bg-blue-500/15 text-blue-400', text: 'Uploaded', Icon: CheckCircle2 },
    saving: { cls: 'bg-amber-500/15 text-amber-400', text: 'Saving', Icon: Loader2 },
    done: { cls: 'bg-emerald-500/15 text-emerald-400', text: 'Done', Icon: CheckCircle2 },
    error: { cls: 'bg-rose-500/15 text-rose-400', text: 'Error', Icon: AlertCircle },
  };
  const { cls, text, Icon } = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${cls}`}>
      {Icon && <Icon className={`w-3 h-3 ${status === 'uploading' || status === 'saving' ? 'animate-spin' : ''}`} />}
      {text}
    </span>
  );
});

BulkEpisodeGenerator.displayName = 'BulkEpisodeGenerator';

export { BulkEpisodeGenerator };