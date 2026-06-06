import { CheckCircle2, Info, X, XCircle } from "lucide-react";

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? XCircle : Info;

  return (
    <div className={`toast toast-${toast.type || "info"}`} role="status">
      <Icon />
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Fechar aviso"><X size={18} /></button>
    </div>
  );
}

export default Toast;
