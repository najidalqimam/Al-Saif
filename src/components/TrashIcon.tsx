/** The usual trash can (lid, handle and three bars), drawn like the other line icons: it takes its colour from the text. */
export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3 6h18" />
      <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
      <path d="M5.5 6l1 13.2A2 2 0 0 0 8.5 21h7a2 2 0 0 0 2-1.8L18.5 6" />
      <path d="M9.5 10v7" />
      <path d="M12 10v7" />
      <path d="M14.5 10v7" />
    </svg>
  );
}
