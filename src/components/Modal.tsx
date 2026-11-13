import { useEffect, useRef, useState, type ReactNode } from "react";
import { IoClose } from "react-icons/io5";
import { useI18n } from "../i18n";

const TRANSITION_MS = 300;

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
};

export default function Modal({ open, onClose, label, children }: Props) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="modal m-auto max-h-none w-full max-w-6xl overflow-visible bg-transparent p-4"
    >
      {mounted && (
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="absolute -top-12 right-0 grid size-10 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:rotate-90 hover:bg-brand"
          >
            <IoClose />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
