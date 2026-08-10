import React from 'react';
import { Type, Palette, Layout, X } from 'lucide-react';

export interface SubtitleStyleConfig {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  color: string;
  bgColor: string;
}

interface SubtitleCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SubtitleStyleConfig;
  onChangeConfig: (newConfig: SubtitleStyleConfig) => void;
}

export const SubtitleCustomizerModal: React.FC<SubtitleCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <Type className="w-5 h-5 text-[#00C2FF]" />
          <h3 className="text-base font-bold text-white">Subtitle Customizer</h3>
        </div>

        {/* Live Subtitle Preview */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden flex items-center justify-center min-h-[90px]">
          <span
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              fontSize:
                config.fontSize === 'small'
                  ? '13px'
                  : config.fontSize === 'medium'
                  ? '16px'
                  : config.fontSize === 'large'
                  ? '20px'
                  : '24px'
            }}
            className="px-3 py-1 rounded font-bold shadow-2xl transition-all"
          >
            안녕! "I've waited so long to see you again."
          </span>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Font Size:</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => onChangeConfig({ ...config, fontSize: size })}
                className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                  config.fontSize === size
                    ? 'bg-[#00C2FF] text-black border-[#00C2FF]'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Text Color:</label>
          <div className="flex items-center gap-2">
            {[
              { label: 'White', hex: '#FFFFFF' },
              { label: 'Yellow', hex: '#FFD700' },
              { label: 'Cyan', hex: '#00C2FF' },
              { label: 'Pink', hex: '#FF2A6D' },
              { label: 'Green', hex: '#00FF66' }
            ].map((c) => (
              <button
                key={c.hex}
                onClick={() => onChangeConfig({ ...config, color: c.hex })}
                style={{ backgroundColor: c.hex }}
                className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                  config.color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Background Box Style */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Background Opacity:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Transparent', bg: 'transparent' },
              { label: 'Dark Box', bg: 'rgba(0,0,0,0.75)' },
              { label: 'Full Solid', bg: '#000000' }
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => onChangeConfig({ ...config, bgColor: b.bg })}
                className={`py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                  config.bgColor === b.bg
                    ? 'bg-cyan-500/20 text-[#00C2FF] border-[#00C2FF]'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Save Subtitle Preferences
        </button>
      </div>
    </div>
  );
};
