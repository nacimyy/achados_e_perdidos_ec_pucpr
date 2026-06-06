import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import LoginModal from "./components/LoginModal.jsx";
import Toast from "./components/Toast.jsx";
import HomePage from "./pages/HomePage.jsx";
import ItemFormPage from "./pages/ItemFormPage.jsx";
import ItemPage from "./pages/ItemPage.jsx";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("achados-user"));
    } catch {
      return null;
    }
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleLogin(loggedUser) {
    localStorage.setItem("achados-user", JSON.stringify(loggedUser));
    setUser(loggedUser);
    setLoginOpen(false);
    setToast({ type: "success", message: `Olá, ${loggedUser.name.split(" ")[0]}. Área administrativa liberada.` });
  }

  function handleLogout() {
    localStorage.removeItem("achados-user");
    setUser(null);
    navigate("/");
    setToast({ type: "info", message: "Você saiu da área administrativa." });
  }

  return (
    <div className="app-shell">
      <Header
        user={user}
        onLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      <main>
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route
            path="/item/:id"
            element={<ItemPage user={user} notify={setToast} />}
          />
          <Route
            path="/admin/items/new"
            element={user ? <ItemFormPage user={user} notify={setToast} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin/items/:id/edit"
            element={user ? <ItemFormPage user={user} notify={setToast} /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={handleLogin}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
