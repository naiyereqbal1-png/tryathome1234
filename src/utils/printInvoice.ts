import html2pdf from 'html2pdf.js';

let colorCanvas: HTMLCanvasElement | null = null;
let colorCtx: CanvasRenderingContext2D | null = null;

/**
 * Accurately resolves ANY CSS color (oklch, oklab, lab, lch, color(), hsl, named, etc.)
 * into standard sRGB rgb(r, g, b) or rgba(r, g, b, a) using native browser 2D Canvas parsing.
 * Eliminates html2canvas parsing errors and prevents color distortion / blue artifacting.
 */
export const resolveCssColorToRgb = (colorStr: string): string => {
  if (!colorStr) return colorStr;
  const trimmed = colorStr.trim();
  if (
    trimmed === 'transparent' ||
    trimmed === 'inherit' ||
    trimmed === 'currentColor' ||
    trimmed === 'none' ||
    trimmed === 'initial'
  ) {
    return trimmed;
  }

  // Already standard hex (3, 4, 6, 8 hex digits)
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return trimmed;
  }

  // Pure numeric rgb/rgba
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d\.]+\s*)?\)$/i.test(trimmed)) {
    return trimmed;
  }

  if (typeof document === 'undefined') return trimmed;

  try {
    if (!colorCanvas) {
      colorCanvas = document.createElement('canvas');
      colorCanvas.width = 1;
      colorCanvas.height = 1;
      colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (!colorCtx) return trimmed;

    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = '#ffffff'; // baseline
    colorCtx.fillStyle = trimmed;
    colorCtx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return 'transparent';
    const alpha = a / 255;
    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch (err) {
    return trimmed;
  }
};

/**
 * Searches and replaces all oklch/oklab/lch/lab/color() definitions within a CSS string
 * with authentic, browser-resolved sRGB rgb/rgba equivalents.
 */
export const sanitizeCssStringColors = (cssText: string): string => {
  if (!cssText || typeof cssText !== 'string') return cssText;
  if (!/(oklch|oklab|lch|lab|color\()/i.test(cssText)) return cssText;

  return cssText.replace(/(oklch|oklab|lch|lab|color)\([^\)]+\)/gi, (match) => {
    return resolveCssColorToRgb(match);
  });
};

/**
 * Shows an on-screen toast notification instead of browser alert()
 */
const showNotificationToast = (message: string, type: 'error' | 'success' = 'error') => {
  const existing = document.getElementById('print-notification-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'print-notification-toast';
  toast.className = `fixed bottom-5 right-5 z-[999999] p-4 rounded-xl shadow-xl border text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
    type === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
  }`;

  toast.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      ${
        type === 'error'
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
      }
    </svg>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.className += ' opacity-0 transition-opacity duration-300';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

/**
 * Shows a modern download dialog for sandboxed or iframe restricted views
 */
const showPDFReadyModal = (blob: Blob, fileName: string, elementId: string) => {
  const blobUrl = URL.createObjectURL(blob);

  // Prevent duplicate modals
  const existing = document.getElementById('pdf-ready-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'pdf-ready-modal';
  modal.className =
    'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity';

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-base font-extrabold text-slate-900">Standard PDF Ready!</h3>
          <p class="text-xs text-slate-500 font-mono">${fileName}</p>
        </div>
      </div>
      
      <p class="text-xs text-slate-600 mb-5 leading-relaxed">
        Your document has been rendered in standard high-resolution PDF format. If direct download did not start automatically, click below to open or print immediately.
      </p>
      
      <div class="flex flex-col gap-2.5">
        <a 
          href="${blobUrl}" 
          target="_blank" 
          rel="noopener noreferrer" 
          id="pdf-modal-open-link"
          class="w-full text-center py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open & Save PDF
        </a>
        
        <button 
          id="pdf-modal-print-btn"
          class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Direct Print / System PDF
        </button>
        
        <button 
          id="pdf-modal-close-btn"
          class="w-full py-2 px-4 bg-transparent hover:bg-slate-100 text-slate-500 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const printBtn = modal.querySelector('#pdf-modal-print-btn');
  const closeBtn = modal.querySelector('#pdf-modal-close-btn');

  printBtn?.addEventListener('click', () => {
    modal.remove();
    printInvoiceElement(elementId, fileName.replace(/\.pdf$/i, ''));
  });

  closeBtn?.addEventListener('click', () => {
    modal.remove();
    URL.revokeObjectURL(blobUrl);
  });
};

/**
 * Triggers a clean print dialog for an invoice element
 * Fully resilient against sandbox iframe limitations
 */
export const printInvoiceElement = (elementId: string, title: string = 'Tax Invoice') => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const originalTitle = document.title;
  document.title = title;

  const wrapper = document.createElement('div');
  wrapper.className = 'print-container-wrapper-temp';
  wrapper.innerHTML = element.innerHTML;

  wrapper.style.position = 'absolute';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.width = '100%';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.zIndex = '9999999';

  const printStyle = document.createElement('style');
  printStyle.id = 'temp-print-override-style';
  printStyle.innerHTML = `
    @media print {
      body > *:not(.print-container-wrapper-temp) {
        display: none !important;
      }
      .print-container-wrapper-temp {
        display: block !important;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: #ffffff !important;
        color: #0f172a !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
      button, input, select, textarea, nav, header, footer, 
      .no-print, .print\\:hidden, [role="tablist"] {
        display: none !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      tr, .card, .invoice-header, .invoice-footer {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
    }
  `;

  document.body.appendChild(wrapper);
  document.head.appendChild(printStyle);

  try {
    window.print();
  } catch (err) {
    console.error('Window print execution error:', err);
    showNotificationToast('Unable to open print dialog due to browser sandbox restrictions.');
  }

  setTimeout(() => {
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    if (printStyle.parentNode) printStyle.parentNode.removeChild(printStyle);
    document.title = originalTitle;
  }, 1000);
};

/**
 * Downloads an element directly as a high-fidelity Standard PDF document.
 * Resolves all Tailwind v4 OKLCH colors into authentic sRGB colors natively,
 * completely preventing solid blue color distortions or missing text.
 */
export const downloadInvoicePDF = async (elementId: string, fileName: string = 'Invoice.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    showNotificationToast('Invoice document container not found.');
    return;
  }

  // 1. Clone element and build an isolated clean rendering container
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Remove elements that should not be printed
  const elementsToRemove = clonedElement.querySelectorAll(
    'button, .no-print, .print\\:hidden, [role="tablist"]'
  );
  elementsToRemove.forEach((el) => el.remove());

  // Deep sanitize attributes & inline styles
  const sanitizeAttributes = (node: HTMLElement) => {
    const attrsToClean = ['style', 'fill', 'stroke', 'color', 'background', 'border-color'];
    for (const attr of attrsToClean) {
      const val = node.getAttribute(attr);
      if (val && /(oklch|oklab|lch|lab|color\()/i.test(val)) {
        node.setAttribute(attr, sanitizeCssStringColors(val));
      }
    }
  };

  sanitizeAttributes(clonedElement);
  clonedElement.querySelectorAll('*').forEach((el) => {
    sanitizeAttributes(el as HTMLElement);
  });

  // Inject crisp, standard PDF styling directly into the cloned element
  const pdfStyle = document.createElement('style');
  pdfStyle.innerHTML = `
    * {
      box-sizing: border-box !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased !important;
    }
    body, #cloned-pdf-root {
      background: #ffffff !important;
      color: #0f172a !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    button, input, select, textarea, nav, header, footer, 
    .no-print, .print\\:hidden, [role="tablist"] {
      display: none !important;
    }
    tr, .card, .invoice-header, .invoice-footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
  `;
  clonedElement.appendChild(pdfStyle);

  // Wrap in a temporary isolated measurement container off-screen
  const container = document.createElement('div');
  container.id = 'cloned-pdf-root';
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-1';
  container.appendChild(clonedElement);
  document.body.appendChild(container);

  const opt = {
    margin: [8, 8, 8, 8],
    filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 850,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  // Intercept window.getComputedStyle to dynamically resolve any oklch / modern colors into exact sRGB
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle.call(window, elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const value = target.getPropertyValue(propertyName);
            if (typeof value === 'string' && /(oklch|oklab|lch|lab|color\()/i.test(value)) {
              return sanitizeCssStringColors(value);
            }
            return value;
          };
        }

        const value = (target as any)[prop];
        if (typeof value === 'string' && /(oklch|oklab|lch|lab|color\()/i.test(value)) {
          return sanitizeCssStringColors(value);
        }

        if (typeof value === 'function') {
          return value.bind(target);
        }

        return value;
      },
    });
  };

  try {
    const blob = await (html2pdf as any)().set(opt).from(clonedElement).toPdf().output('blob');

    // Trigger instant standard browser download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = opt.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show guaranteed access modal for iframe / sandboxed preview environments
    showPDFReadyModal(blob, opt.filename, elementId);
  } catch (err) {
    console.error('PDF generation error:', err);
    printInvoiceElement(elementId, fileName);
  } finally {
    // Restore getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;
    // Clean up temporary container
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};
