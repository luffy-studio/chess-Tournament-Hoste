import toast from 'react-hot-toast';

export interface CopyOptions {
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

let lastCopyTime = 0;
const COPY_DEBOUNCE_MS = 300;

/**
 * Universal, reliable clipboard copy utility.
 * - Tests navigator.clipboard.writeText in secure contexts.
 * - Gracefully falls back to document.execCommand('copy') on non-secure contexts (e.g. LAN IPs, legacy browsers).
 * - Never crashes the application.
 * - Handles errors and displays appropriate notifications.
 */
export async function copyToClipboard(
  text: string,
  options: CopyOptions = {}
): Promise<boolean> {
  const {
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy to clipboard',
    showToast = true,
  } = options;

  if (!text || typeof text !== 'string') {
    if (showToast) toast.error('Nothing to copy');
    return false;
  }

  // Prevent rapid double-clicks from clashing
  const now = Date.now();
  if (now - lastCopyTime < COPY_DEBOUNCE_MS) {
    return false;
  }
  lastCopyTime = now;

  // 1. Try Modern Clipboard API (Only works in Secure Contexts: HTTPS or localhost)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function' &&
    (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    try {
      await navigator.clipboard.writeText(text);
      if (showToast) {
        toast.success(successMessage, { id: 'clipboard-toast' });
      }
      return true;
    } catch (err) {
      console.warn('Modern Clipboard API failed, attempting legacy fallback:', err);
    }
  }

  // 2. Legacy Fallback via off-screen <textarea> + document.execCommand('copy')
  // This works reliably on HTTP, LAN IPs (e.g. 192.168.x.x), iframes, and mobile devices
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.setAttribute('aria-hidden', 'true');

    // Place element completely off-screen and invisible
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.style.zIndex = '-9999';

    document.body.appendChild(textarea);

    // Select text content
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      if (showToast) {
        toast.success(successMessage, { id: 'clipboard-toast' });
      }
      return true;
    } else {
      throw new Error('execCommand returned false');
    }
  } catch (fallbackErr) {
    console.error('All clipboard methods failed:', fallbackErr);
    if (showToast) {
      toast.error(errorMessage, { id: 'clipboard-toast' });
    }
    return false;
  }
}
