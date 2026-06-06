import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { api } from "../api.js";
import Modal from "./Modal.jsx";

function LoginModal({ open, onClose, onLogin }) {
  const [email, setEmail] = useState("funcionario@pucpr.br");
  const [password, setPassword] = useState("pucpr");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      onLogin(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Acesso restrito"
      title="Área do funcionário"
      className="login-modal"
    >
      <p className="modal-intro">
        Entre para cadastrar itens e registrar retiradas. Os dados de demonstração já estão preenchidos.
      </p>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>E-mail institucional</span>
          <span className="input-with-icon">
            <Mail size={19} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </span>
        </label>
        <label className="field">
          <span>Senha</span>
          <span className="input-with-icon">
            <LockKeyhole size={19} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              className="input-action"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary button-block" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </Modal>
  );
}

export default LoginModal;
