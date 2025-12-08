import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const handleSuccess = async (credentialResponse: any) => {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                onLoginSuccess(data.user);
            } else {
                alert("Acceso denegado: " + (data.message || "Usuario no autorizado"));
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Error al iniciar sesión");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-black text-white">
            <div className="text-center space-y-6 p-10 glass-panel rounded-2xl border border-white/10">
                <h1 className="text-3xl font-bold mb-2">ERP Sales Dashboard</h1>
                <p className="text-gray-400 mb-8">Inicia sesión para acceder</p>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => {
                            console.log('Login Failed');
                            alert("Fallo al conectar con Google");
                        }}
                        theme="filled_black"
                        shape="pill"
                    />
                </div>

                <p className="text-xs text-gray-600 mt-4">Solo usuarios autorizados</p>
            </div>
        </div>
    );
};

export default Login;
