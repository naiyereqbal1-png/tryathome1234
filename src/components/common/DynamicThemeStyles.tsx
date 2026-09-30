import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';

export const DynamicThemeStyles: React.FC = () => {
  const [settings, setSettings] = useState(() => db.getSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(db.getSettings());
    };
    window.addEventListener('style1_data_changed', handleUpdate);
    return () => {
      window.removeEventListener('style1_data_changed', handleUpdate);
    };
  }, []);

  const primary = settings.theme_primary || settings.primary_color || '#d97706';
  const secondary = settings.theme_secondary || settings.secondary_color || '#fef3c7';
  const accent = settings.theme_accent || settings.accent_color || '#f59e0b';
  const bg = settings.theme_background || settings.bg_color || '#fafaf9';
  const cardBg = settings.theme_card_background || '#ffffff';
  const text = settings.theme_text || settings.text_color || '#334155';
  const heading = settings.theme_heading || settings.heading_color || '#0f172a';
  const button = settings.theme_button || settings.primary_color || '#d97706';
  const buttonText = settings.theme_button_text || settings.button_text_color || '#ffffff';
  const border = settings.theme_border || settings.border_color || '#fcd34d';
  const header = settings.theme_header || settings.header_bg_color || '#ffffff';
  const footer = settings.theme_footer || settings.footer_bg_color || '#0f172a';
  const headerText = settings.header_text_color || '#0f172a';

  return (
    <style id="website-dynamic-theme-style">{`
      :root {
        --theme-primary: ${primary};
        --theme-secondary: ${secondary};
        --theme-accent: ${accent};
        --theme-background: ${bg};
        --theme-card-background: ${cardBg};
        --theme-text: ${text};
        --theme-heading: ${heading};
        --theme-button: ${button};
        --theme-button-text: ${buttonText};
        --theme-border: ${border};
        --theme-header: ${header};
        --theme-footer: ${footer};
      }

      /* Helper classes to dynamically inject configured theme colors */
      .theme-bg-primary { background-color: var(--theme-primary) !important; }
      .theme-text-primary { color: var(--theme-primary) !important; }
      .theme-border-primary { border-color: var(--theme-primary) !important; }

      .theme-bg-secondary { background-color: var(--theme-secondary) !important; }
      .theme-text-secondary { color: #78350f !important; }

      .theme-bg-accent { background-color: var(--theme-accent) !important; }
      .theme-text-accent { color: var(--theme-accent) !important; }

      .theme-bg-body { background-color: var(--theme-background) !important; }
      .theme-bg-card { background-color: var(--theme-card-background) !important; }
      
      .theme-text-body { color: var(--theme-text) !important; }
      .theme-text-heading { color: var(--theme-heading) !important; }
      
      .theme-btn-primary { 
        background-color: var(--theme-button) !important; 
        color: var(--theme-button-text) !important; 
        font-weight: 700 !important;
      }
      .theme-btn-primary:hover {
        filter: brightness(0.92) !important;
      }
      
      .theme-border-color { border-color: var(--theme-border) !important; }
      
      .theme-bg-header { 
        background-color: var(--theme-header) !important; 
        color: ${headerText} !important;
      }
      
      .theme-bg-footer { background-color: var(--theme-footer) !important; }

      /* Apply dynamic styles directly to standard elements to ensure full coverage */
      body {
        background-color: var(--theme-background);
        color: var(--theme-text);
      }
      h1, h2, h3, h4, h5, h6 {
        color: var(--theme-heading);
      }

      /* Seamless Global Yellow / Amber Golden Theme Overrides */
      .bg-indigo-600, .bg-indigo-500, .bg-teal-600 {
        background-color: var(--theme-primary) !important;
      }
      .hover\:bg-indigo-700:hover, .hover\:bg-teal-700:hover, .hover\:bg-indigo-800:hover {
        background-color: var(--theme-primary) !important;
        filter: brightness(0.9) !important;
      }
      .text-indigo-600, .text-teal-600, .text-indigo-500 {
        color: var(--theme-primary) !important;
      }
      .border-indigo-600, .border-teal-600, .border-indigo-500 {
        border-color: var(--theme-primary) !important;
      }
      .focus\:ring-indigo-500:focus, .focus\:ring-teal-500:focus {
        --tw-ring-color: var(--theme-primary) !important;
      }
      
      /* Badges & Soft Amber Highlights */
      .bg-indigo-50, .bg-teal-50 {
        background-color: var(--theme-secondary) !important;
      }
      .text-indigo-700, .text-teal-700, .text-indigo-900 {
        color: #78350f !important;
      }
      
      /* Active tab highlight & ring indicators */
      .ring-indigo-200, .ring-indigo-500 {
        --tw-ring-color: #fde68a !important;
      }
    `}</style>
  );
};
