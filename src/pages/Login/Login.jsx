import { useState } from "react";
// Imports de Firebase necesarios para la autenticación
import { auth } from "../../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// Iconos visuales para mejorar la UX del formulario
import { Mail, Lock, ArrowRight, Info, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  // --- ESTADOS ---
  // Controlamos si el usuario quiere iniciar sesión o registrarse
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estado para UX: Mostrar/Ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Gestión de errores y carga
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // Hook para redirigir tras el login

  // --- LÓGICA DE LOGIN/REGISTRO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpiamos errores previos
    setLoading(true);

    // 1. Validación de dominio institucional
    // Solo permitimos correos de @euneiz.com para asegurar que son alumnos/profesores
    if (!email.endsWith("@euneiz.com")) {
      setError("Acceso restringido a cuentas institucionales (@euneiz.com)");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        // Registro de nuevo usuario en Firebase
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Inicio de sesión estándar
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Si todo va bien, redirigimos al dashboard principal
      navigate("/home"); 
      
    } catch (err) {
      // Gestión de errores comunes de Firebase para dar feedback útil al usuario
      console.error(err); // Log para depuración
      
      let msg = "Error al conectar. Inténtalo de nuevo.";
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = "Credenciales incorrectas. Revisa tu correo o contraseña.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "Este correo ya está registrado. Intenta iniciar sesión.";
      } else if (err.code === 'auth/weak-password') {
        msg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.code === 'auth/user-not-found') {
        msg = "No existe una cuenta con este correo.";
      }
      
      setError(msg);
    } finally {
      setLoading(false); // Desbloqueamos el botón pase lo que pase
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        {/* LADO IZQUIERDO: Branding e Identidad Visual */}
        <div className="login-brand-side">
          <div className="brand-content">
            <div className="logo-badge">HUB</div>
            <h1>EUNEIZ</h1>
            <p className="brand-tagline">Tu campus universitario, digitalizado.</p>
            
            {/* Lista de características (Solo visible en desktop) */}
            <div className="feature-list">
              <div className="feature-item">
                <ShieldCheck size={18} />
                <span>Acceso seguro institucional</span>
              </div>
              <div className="feature-item">
                <Info size={18} />
                <span>Versión Beta 1.0</span>
              </div>
            </div>
          </div>
          
          {/* Elementos decorativos de fondo */}
          <div className="brand-circles">
            <div className="circle c1"></div>
            <div className="circle c2"></div>
          </div>
        </div>

        {/* LADO DERECHO: Formulario de Acceso */}
        <div className="login-form-side">
          <div className="form-header">
            <h2>{isRegistering ? "Crear cuenta" : "Bienvenido"}</h2>
            <p>Introduce tus credenciales universitarias</p>
          </div>

          {/* Aviso de prototipo (Para contexto académico) */}
          <div className="prototype-alert">
            <Info size={16} className="alert-icon" />
            <p>
              <strong>Nota de desarrollo:</strong> En la versión final, la validación se realizará mediante SSO (Single Sign-On) oficial de la universidad.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Banner de error condicional */}
            {error && <div className="error-banner">{error}</div>}

            {/* Campo Email */}
            <div className="input-group">
              <label>Correo Electrónico</label>
              <div className="input-wrapper">
                <Mail size={18} className="field-icon" />
                <input 
                  type="email" 
                  placeholder="usuario@euneiz.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña con Toggle de visibilidad */}
            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock size={18} className="field-icon" />
                <input 
                  // Cambiamos el tipo de input dinámicamente
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  // Añadimos padding extra a la derecha para que el texto no se monte sobre el ojo
                  style={{ paddingRight: '2.8rem' }}
                />
                
                {/* Botón para ver/ocultar contraseña */}
                <button 
                  type="button" // Importante: type="button" para no enviar el form al clicar
                  className="btn-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1" // Lo sacamos del flujo de tabulación para ir más rápido
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {/* Botón de envío con estado de carga */}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Procesando..." : (isRegistering ? "Registrarse" : "Acceder al Campus")}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Footer para alternar entre Login y Registro */}
          <div className="form-footer">
            <p>
              {isRegistering ? "¿Ya tienes cuenta?" : "¿Aún no tienes acceso?"}
              <button 
                type="button" 
                className="btn-toggle"
                onClick={() => { setError(""); setIsRegistering(!isRegistering); }}
              >
                {isRegistering ? "Inicia sesión" : "Regístrate aquí"}
              </button>
            </p>
          </div>
        </div>

      </div>
      
      <p className="footer-credits">© 2026 Euneiz Hub Project</p>
    </div>
  );
};