import { useState } from "react";
import { auth } from "../../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Importamos su CSS propio

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 🛑 RESTRICCIÓN EUNEIZ
    if (!email.endsWith("@euneiz.com")) {
      setError("El acceso está restringido exclusivamente al dominio @euneiz.com");
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/home"); // Redirigir al perfil tras éxito
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>{isRegistering ? "Registro EUNEIZ" : "Acceso EUNEIZ"}</h2>
        
        {error && <p className="error-msg">{error}</p>}

        <input 
          type="email" 
          placeholder="correo@euneiz.com" 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        <button type="submit">
          {isRegistering ? "Registrarse" : "Entrar"}
        </button>

        <p onClick={() => setIsRegistering(!isRegistering)} className="toggle-text">
          {isRegistering 
            ? "¿Ya tienes cuenta? Inicia sesión" 
            : "¿No tienes cuenta? Regístrate"}
        </p>
      </form>
    </div>
  );
};