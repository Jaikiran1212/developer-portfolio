// ==============================================================================
// ACCESSIBLE MODAL DIALOG HELPER: focus trap, Escape, scroll lock, focus restore
// ==============================================================================
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function openDialog(modal, { onClose } = {}) {
  const opener = document.activeElement;
  const html = document.documentElement;
  const prevOverflow = html.style.overflow;
  const background = document.getElementById('pub');
  html.style.overflow = 'hidden';
  background?.setAttribute('inert', '');

  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    modal.remove();
    html.style.overflow = prevOverflow;
    background?.removeAttribute('inert');
    if (opener && typeof opener.focus === 'function') opener.focus();
    if (onClose) onClose();
  };

  const onKey = (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      close();
      return;
    }
    if (ev.key !== 'Tab') return;
    const items = [...modal.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) {
      ev.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (!modal.contains(active)) {
      ev.preventDefault();
      first.focus();
    } else if (ev.shiftKey && active === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && active === last) {
      ev.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKey, true);
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal || ev.target.closest('[data-x]')) close();
  });
  document.body.appendChild(modal);
  const first = modal.querySelector('[data-x]') || modal.querySelector(FOCUSABLE) || modal.firstElementChild;
  first?.focus?.();
  return close;
}
