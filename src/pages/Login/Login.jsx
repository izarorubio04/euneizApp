import { useState } from "react";
import { auth } from "../../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// AÑADIDO: Eye y EyeOff
import { Mail, Lock, ArrowRight, Info, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // AÑADIDO: Estado para ver/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.endsWith("@euneiz.com")) {
      setError("Acceso restringido a cuentas institucionales (@euneiz.com)");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/home"); 
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' 
        ? "Credenciales incorrectas." 
        : err.code === 'auth/email-already-in-use'
        ? "Este correo ya está registrado."
        : "Error al conectar. Inténtalo de nuevo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        {/* LADO IZQUIERDO: BRANDING */}
        <div className="login-brand-side">
          <div className="brand-content">
            <div className="logo-badge">HUB</div>
            <h1>EUNEIZ</h1>
            <p className="brand-tagline">Tu campus universitario, digitalizado.</p>
            
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
          
          <div className="brand-circles">
            <div className="circle c1"></div>
            <div className="circle c2"></div>
          </div>
        </div>

        {/* LADO DERECHO: FORMULARIO */}
        <div className="login-form-side">
          <div className="form-header">
            <h2>{isRegistering ? "Crear cuenta" : "Bienvenido"}</h2>
            <p>Introduce tus credenciales universitarias</p>
          </div>

          <div className="prototype-alert">
            <Info size={16} className="alert-icon" />
            <p>
              <strong>Nota de desarrollo:</strong> En la versión final, la validación se realizará mediante SSO (Single Sign-On) oficial de la universidad.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-banner">{error}</div>}

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

            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock size={18} className="field-icon" />
                <input 
                  // CAMBIO: Tipo dinámico según el estado
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  // CAMBIO: Padding derecho extra para que no pise el ojo
                  style={{ paddingRight: '2.8rem' }}
                />
                
                {/* AÑADIDO: Botón del ojito */}
                <button 
                  type="button"
                  className="btn-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Procesando..." : (isRegistering ? "Registrarse" : "Acceder al Campus")}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

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
      
      <p className="footer-credits">© 2024 Euneiz Hub Project</p>
    </div>
  );
};