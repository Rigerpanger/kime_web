import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AdminLayout from './AdminLayout';
import {
    Plus, Trash2, Upload, Info, Save, Award, Edit2, X, Image as ImageIcon, Loader2
} from 'lucide-react';

const ManageAbout = () => {
    const { session } = useAuthStore();
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const photoInputRef = useRef(null);
    
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [textContent, setTextContent] = useState({
        slide1_title: 'О СТУДИИ',
        slide1_text1: '', slide1_text2: '',
        slide2_title: 'НАШ ПОДХОД', slide2_text: '',
        slide3_quote: '', slide3_name: '', slide3_role: '',
        slide3_photo: '',
        verticalOffsetMobile: -148, verticalOffsetDesktop: -236,
        logoOffsetMobile: 32, logoOffsetDesktop: 48
    });

    const [certificates, setCertificates] = useState([]);
    const [savingText, setSavingText] = useState(false);
    
    // Certs State
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [certUploading, setCertUploading] = useState(false);
    const [editingCertId, setEditingCertId] = useState(null);
    const [certForm, setCertForm] = useState({ company: '', division: '', position: '', image_url: '', file: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, certRes] = await Promise.all([
                fetch(`${apiUrl}/content/about_page`),
                fetch(`${apiUrl}/certificates`)
            ]);
            
            if (cRes.ok) {
                const data = await cRes.json();
                setTextContent(prev => ({ ...prev, ...data }));
            }
            if (certRes.ok) setCertificates(await certRes.json());
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file) => {
        const data = new FormData();
        data.append('image', file);
        const response = await fetch(`${apiUrl}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.token}` },
            body: data
        });
        const res = await response.json();
        if (!response.ok) throw new Error(res.error);
        return apiUrl + res.url;
    };

    const handleTextSave = async () => {
        setSavingText(true);
        try {
            const response = await fetch(`${apiUrl}/content/about_page`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.token}` 
                },
                body: JSON.stringify(textContent)
            });
            if (response.ok) alert('Тексты сохранены!');
        } catch (error) {
            alert('Ошибка при сохранении');
        } finally {
            setSavingText(false);
        }
    };

    const handleDirectorPhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadFile(file);
            setTextContent(prev => ({ ...prev, slide3_photo: url }));
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    // --- Certificates CRUD ---
    const resetCertForm = () => {
        setCertForm({ company: '', division: '', position: '', image_url: '', file: null });
        setEditingCertId(null);
        setIsCertModalOpen(false);
    };

    const handleSaveCertificate = async () => {
        if (!certForm.company) return alert('Укажите название компании');
        setCertUploading(true);
        try {
            let image_url = certForm.image_url;
            if (certForm.file) {
                image_url = await uploadFile(certForm.file);
            }

            if (!image_url) {
                setCertUploading(false);
                return alert('Загрузите изображение сертификата');
            }

            const body = {
                company: certForm.company,
                division: certForm.division,
                position: certForm.position,
                image_url: image_url,
                order_index: editingCertId ? certificates.find(c => c.id === editingCertId).order_index : certificates.length
            };

            const url = editingCertId ? `${apiUrl}/certificates/${editingCertId}` : `${apiUrl}/certificates`;
            const method = editingCertId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.token}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                resetCertForm();
                fetchData();
            } else {
                alert('Ошибка при сохранении сертификата');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setCertUploading(false);
        }
    };

    const handleDeleteCertificate = async (id) => {
        if (!window.confirm('Удалить этот сертификат?')) return;
        try {
            const response = await fetch(`${apiUrl}/certificates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.token}` }
            });
            if (response.ok) fetchData();
        } catch (err) {
            alert('Ошибка удаления');
        }
    };

    const openEditCert = (cert) => {
        setCertForm({ 
            company: cert.company || '', 
            division: cert.division || '', 
            position: cert.position || '', 
            image_url: cert.image_url || '', 
            file: null 
        });
        setEditingCertId(cert.id);
        setIsCertModalOpen(true);
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64 text-gray-500 uppercase tracking-widest text-xs animate-pulse">
                Загрузка данных...
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-thin tracking-widest uppercase mb-2">О студии</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Управление контентом страницы Абаут</p>
                </div>
                <button onClick={handleTextSave} disabled={savingText} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">
                    <Save size={16} /> {savingText ? 'Сохранение...' : 'Сохранить тексты'}
                </button>
            </div>

            <div className="space-y-12 pb-32">
                {/* SLIDE 1 */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 text-sm font-mono">01</div>
                        <h3 className="text-sm font-light uppercase tracking-widest">Слайд 1: Описание</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest text-white/30 ml-2">Левый текст</label>
                             <textarea 
                                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:outline-none focus:border-white/30 transition-all font-light leading-relaxed" 
                                value={textContent.slide1_text1} 
                                onChange={e => setTextContent({...textContent, slide1_text1: e.target.value})} 
                                placeholder="Основное описание..." 
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest text-white/30 ml-2">Правый (дополнительный) текст</label>
                             <textarea 
                                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:outline-none focus:border-white/30 transition-all font-light leading-relaxed" 
                                value={textContent.slide1_text2} 
                                onChange={e => setTextContent({...textContent, slide1_text2: e.target.value})} 
                                placeholder="Дополнительные детали..." 
                             />
                        </div>
                    </div>
                </section>

                {/* SLIDE 2: APPROACH */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 text-sm font-mono">02</div>
                        <h3 className="text-sm font-light uppercase tracking-widest">Слайд 2: Наш подход</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest text-white/30 ml-2">Заголовок подхода</label>
                             <input 
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-white/30 transition-all" 
                                value={textContent.slide2_title} 
                                onChange={e => setTextContent({...textContent, slide2_title: e.target.value})} 
                                placeholder="НАПРИМЕР: НАШ ПОДХОД" 
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest text-white/30 ml-2">Текст подхода</label>
                             <textarea 
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:outline-none focus:border-white/30 transition-all font-light leading-relaxed" 
                                value={textContent.slide2_text} 
                                onChange={e => setTextContent({...textContent, slide2_text: e.target.value})} 
                                placeholder="Опишите ваш подход здесь..." 
                             />
                        </div>
                    </div>
                </section>

                {/* SLIDE 3: DIRECTOR */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 text-sm font-mono">03</div>
                        <h3 className="text-sm font-light uppercase tracking-widest">Слайд 3: Руководитель</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                        <div className="md:col-span-1 space-y-4">
                            <div className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
                                {textContent.slide3_photo ? (
                                    <img src={textContent.slide3_photo} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 transition-all" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/10"><ImageIcon size={40} /></div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <button onClick={() => photoInputRef.current?.click()} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                                        <Upload size={18} />
                                    </button>
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white/60"><Loader2 className="animate-spin" /></div>
                                )}
                            </div>
                            <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handleDirectorPhotoUpload} />
                            <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest">3:4 Portrait Image</p>
                        </div>
                        <div className="md:col-span-3 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-2">Имя Фамилия</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" value={textContent.slide3_name} onChange={e => setTextContent({...textContent, slide3_name: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-2">Должность</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" value={textContent.slide3_role} onChange={e => setTextContent({...textContent, slide3_role: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-white/20 ml-2">Цитата руководителя</label>
                                <textarea className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm italic focus:outline-none" value={textContent.slide3_quote} onChange={e => setTextContent({...textContent, slide3_quote: e.target.value})} placeholder="Глубокая мысль..." />
                            </div>
                        </div>
                    </div>
                </section>

                {/* SLIDE 4: CERTIFICATES */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 text-sm font-mono">04</div>
                            <h3 className="text-sm font-light uppercase tracking-widest">Слайд 4: Нам доверяют</h3>
                        </div>
                        <button onClick={() => setIsCertModalOpen(true)} className="flex items-center gap-2 bg-white/5 text-white/80 px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 hover:text-white transition-all border border-white/5">
                            <Plus size={14} /> Добавить сертификат
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map(cert => (
                            <div key={cert.id} className="group relative bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all p-5">
                                <div className="flex gap-4 items-start mb-4">
                                    <div className="w-16 h-20 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0">
                                        <img src={cert.image_url} alt="" className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-medium text-white truncate">{cert.company}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 truncate">{cert.division}</p>
                                        <p className="text-[9px] text-gray-400 font-light mt-1 italic truncate">{cert.position}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditCert(cert)} className="flex-1 py-2 bg-white/5 text-white/40 text-[9px] uppercase tracking-widest rounded-md hover:bg-white/10 hover:text-white transition-all">Редактировать</button>
                                    <button onClick={() => handleDeleteCertificate(cert.id)} className="p-2 bg-red-500/5 text-red-500/50 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                        {certificates.length === 0 && (
                            <div className="col-span-full py-20 text-center text-white/10 flex flex-col items-center gap-4">
                                <Award size={48} strokeWidth={1} />
                                <span className="uppercase tracking-[0.3em] text-[10px]">Список сертификатов пуст</span>
                            </div>
                        )}
                    </div>
                </section>



                {/* SETTINGS: OFFSETS */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 text-sm">
                            <Settings size={20} />
                        </div>
                        <h3 className="text-sm font-light uppercase tracking-widest">Настройки отображения (Отступы)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/40">Вертикальное смещение (вверх/вниз)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Десктоп (ПК)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={textContent.verticalOffsetDesktop} 
                                        onChange={e => setTextContent({...textContent, verticalOffsetDesktop: parseInt(e.target.value) || 0})} 
                                    />
                                    <p className="text-[8px] text-gray-500 italic">Чем меньше число (напр. -300), тем выше контент</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Мобильные</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={textContent.verticalOffsetMobile} 
                                        onChange={e => setTextContent({...textContent, verticalOffsetMobile: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/40">Отступ логотипа (Partners)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Десктоп (ПК)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={textContent.logoOffsetDesktop} 
                                        onChange={e => setTextContent({...textContent, logoOffsetDesktop: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Мобильные</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={textContent.logoOffsetMobile} 
                                        onChange={e => setTextContent({...textContent, logoOffsetMobile: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-500/80 leading-relaxed uppercase tracking-widest">
                            Мы внедрили умную адаптивность: теперь контент автоматически центрируется и не залезает на шапку. 
                            Значение "0" — это идеальный центр. Используйте офсеты только для микро-коррекции (+/- 50), если хотите чуть-чуть подвинуть текст.
                        </p>
                    </div>
                </section>
            </div>

            {/* CERTIFICATE MODAL */}
            {isCertModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative">
                        <button onClick={resetCertForm} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24} /></button>
                        
                        <div className="p-8 md:p-12 space-y-10">
                            <div>
                                <h3 className="text-xl font-light uppercase tracking-widest text-white mb-2">{editingCertId ? 'Правка сертификата' : 'Новое достижение'}</h3>
                                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-medium">Заполните данные для Слайда 4</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                                <div className="md:col-span-4 space-y-4">
                                    <div className="aspect-[210/297] bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-white/20 group relative overflow-hidden">
                                        {(certForm.file || certForm.image_url) ? (
                                            <img 
                                                src={certForm.file ? URL.createObjectURL(certForm.file) : certForm.image_url} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <>
                                                <ImageIcon size={32} strokeWidth={1} className="mb-4" />
                                                <span className="text-[9px] uppercase tracking-widest text-center px-4">Скан документа</span>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={() => document.getElementById('certFile')?.click()}>
                                            <Upload className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <input type="file" id="certFile" className="hidden" accept="image/*" onChange={e => setCertForm({...certForm, file: e.target.files[0]})} />
                                    <p className="text-[9px] text-center text-gray-600 uppercase tracking-widest leading-relaxed">PDF не поддерживается.<br/>Используйте JPG/PNG</p>
                                </div>

                                <div className="md:col-span-8 space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-white/30 ml-1">Компания</label>
                                        <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" value={certForm.company} onChange={e => setCertForm({...certForm, company: e.target.value})} placeholder="Напр: ОАО РЖД" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-white/30 ml-1">Подразделение (необязательно)</label>
                                        <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" value={certForm.division} onChange={e => setCertForm({...certForm, division: e.target.value})} placeholder="Напр: ВНИИЖТ" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-white/30 ml-1">Должность подписанта</label>
                                        <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" value={certForm.position} onChange={e => setCertForm({...certForm, position: e.target.value})} placeholder="Зам. ген директора..." />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={resetCertForm} className="flex-1 py-4 text-gray-500 uppercase tracking-widest text-[10px] hover:text-white transition-all">Отмена</button>
                                <button onClick={handleSaveCertificate} disabled={certUploading} className="flex-[2] py-4 bg-white text-black rounded-xl uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {certUploading && <Loader2 size={16} className="animate-spin" />}
                                    {editingCertId ? 'Сохранить изменения' : 'Добавить сертификат'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default ManageAbout;
