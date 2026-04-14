import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';

const MaintenanceOverlay = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const signIn = useAuthStore(state => state.signIn);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
        } catch (err) {
            setError(err.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black p-4">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ backgroundSize: '30px 30px', backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)' }} 
            />
            
            <div className="w-full max-w-md bg-[#080808] border border-white/5 p-10 rounded-[2rem] shadow-2xl backdrop-blur-3xl relative z-10 transition-all">
                <div className="mb-10 text-center">
                    <h1 className="text-xl font-thin tracking-[0.4em] uppercase text-white mb-4">
                        KIME <span className="text-indigo-500 font-normal">STUDIO</span>
                    </h1>
                    <div className="h-px w-12 bg-indigo-500 mx-auto mb-6" />
                    <h2 className="text-white text-lg font-bold mb-2">Мы делаем сайт лучше</h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                        Режим технического обслуживания
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[9px] uppercase tracking-[0.3em] text-gray-400 px-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="admin@kime.pro"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[9px] uppercase tracking-[0.3em] text-gray-400 px-1">
                            Пароль
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-[9px] uppercase tracking-widest p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 text-white text-[10px] uppercase tracking-[0.3em] font-black py-5 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className="mt-10 text-center text-[8px] text-white/20 uppercase tracking-[0.5em]">
                    © 2026 KIME DIGITAL AGENCY
                </p>
            </div>
        </div>
    );
};

export default MaintenanceOverlay;
