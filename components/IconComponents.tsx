import React from 'react';

export const UserIcon: React.FC = () => (
  <span className="font-body text-sm text-[var(--text-tertiary)] select-none">[User]</span>
);

export const AiAvatarIcon: React.FC = () => (
  <span className="font-body text-sm text-[var(--text-tertiary)] select-none">[Ψ-4ndr0666]</span>
);

export const SplashScreenGlyphIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    stroke="var(--accent-cyan)"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path className="glyph-ring-1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" strokeDasharray="21.78 21.78" strokeWidth="2" />
    <path className="glyph-ring-2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" strokeDasharray="10 10" strokeWidth="1.5" opacity="0.7" />
    <path className="glyph-hex" d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" />
    <text
      x="64"
      y="69"
      textAnchor="middle"
      dominantBaseline="middle"
      fill="var(--accent-cyan)"
      stroke="none"
      fontSize="56"
      fontWeight="700"
      fontFamily="'Cinzel Decorative', serif"
      className="glyph-core-psi"
    >
      Ψ
    </text>
  </svg>
);


export const SendIcon: React.FC = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24"
        height="24"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-[var(--accent-cyan-mid)] group-hover:text-[var(--accent-cyan)] group-hover:drop-shadow-[0_0_4px_var(--accent-cyan)] transition-all duration-300 group-disabled:text-slate-500 group-disabled:hover:drop-shadow-none"
    >
        <path d="m3 3 3 9-3 9 19-9Z"></path><path d="M6 12h16"></path>
    </svg>
);

export const CopyIcon: React.FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
    </svg>
);

export const CheckIcon: React.FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-success"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export const EditIcon: React.FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"
        />
    </svg>
);

export const SpinnerIcon: React.FC = () => (
    <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-2 border-dashed border-[var(--accent-cyan)] rounded-md animate-spin-slow" />
        <div className="absolute inset-2 border-2 border-dashed border-[var(--accent-cyan-dark)] rounded-md animate-spin-slow [animation-direction:reverse]" />
    </div>
);

export const ScrollUpIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 15L12 9L6 15" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const ScrollDownIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const ClearIcon: React.FC = () => (
  <span className="text-2xl leading-none font-light" aria-hidden="true">&times;</span>
);

export const LinkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </svg>
);

export const PaperclipIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
);

export const AutoScrollOnIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-6 w-6"}>
        <path d="M12 3v14m-4-4l4 4 4-4"/>
    </svg>
);

export const AutoScrollOffIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-6 w-6"}>
        <path d="M12 3v14m-4-4l4 4 4-4"/>
        <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
);

export const SuggestionsOnIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-6 w-6"}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
);

export const SuggestionsOffIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-6 w-6"}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
        <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
);

export const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" />
    </svg>
);

export const SaveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);

export const MemoryWipeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M2 12h2.5a2.5 2.5 0 1 0 0-5H2v5z"/><path d="M2 17h2.5a2.5 2.5 0 1 1 0 5H2v-5z"/><path d="M19.5 7H22v5h-2.5a2.5 2.5 0 0 1 0-5z"/><path d="M19.5 12H22v5h-2.5a2.5 2.5 0 0 0 0-5z"/><path d="M11 2a2.5 2.5 0 0 0-5 0v1.5A2.5 2.5 0 0 0 8.5 6H12a3 3 0 0 0 3-3V2h-4z"/><path d="m15 22 3.5-1.5 3.5 1.5-2-4.5-2 4.5z"/><path d="M12.5 6H15a2.5 2.5 0 0 1 2.5 2.5V10"/><path d="M11 22v-6.5A2.5 2.5 0 0 0 8.5 13H6"/></svg>
);

export const ChangelogIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);

export const ThoughtIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 2a10 10 0 1 0-10 10" />
        <path d="M12 2v20" />
        <path d="M2 12h20" />
        <path d="M12 2a10 10 0 0 0-4.17 18.17" />
        <path d="M12 2a10 10 0 0 1 4.17 18.17" />
    </svg>
);
