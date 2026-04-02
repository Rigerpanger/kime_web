import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AdminLayout from './AdminLayout';
import {
    Plus, Trash2, Upload, Info, Save, Award, Edit2, X
} from 'lucide-react';

const ManageAbout = () => {
    const { session } = useAuthStore();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const [partners, setPartners] = useState([]);
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
    const [certUploading, setCertUploading] = useState(false);
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [newCert, setNewCert] = useState({ company: '', division: '', position: '', file: null });
    const [editingCertId, setEditingCertId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes, certRes] = await Promise.all([
                fetch(`${apiUrl}/partners`),
                fetch(`${apiUrl}/content/about_page`),
                fetch(`${apiUrl}/certificates`)
            ]);
            
            if (pRes.ok) setPartners(await pRes.json());
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

    const handleTextSave = async () => {
        setSavingText(true);
        try {
            const response = await fetch(`${apiUrl}/api/content/about_page`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.token}` 
                },
                body: JSON.stringify(textContent)
            });
            if (response.ok) alert('Сохранено!');
        } catch (error) {
            alert('Ошибка при сохранении');
        } finally {
            setSavingText(false);
        }
    };

    const uploadFile = async (file) => {
        const data = new FormData();
        data.append('image', file);
        const response = await fetch(`${apiUrl}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.token}` },
            body: data
        });
        const res = await response.json();
        if (!response.ok) throw new Error(res.error);
        return apiUrl + res.url;
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadFile(file);
            // Тут нужно было бы добавить запись в БД partners, 
            // Реализуем по аналогии с проектами если нужно управление списком.
            alert('Логотип загружен!');
            fetchData();
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAddCertificate = async () => {
        if (!newCert.company) return alert('Укажите компанию');
        setCertUploading(true);
        try {
            let image_url = certificates.find(c => c.id === editingCertId)?.image_url;
            if (newCert.file) image_url = await uploadFile(newCert.file);

            const certData = { ...newCert, image_url, file: undefined };
            const method = editingCertId ? 'PUT' : 'POST';
            // Добавим эндпоинты для сертификатов на бэкенд если решим делать CRUD полностью
            alert('Функция в разработке (нужны эндпоинты сертификатов)');
        } finally {
            setCertUploading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-thin tracking-widest uppercase mb-2">О студии</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Управление контентом на вашем VPS</p>
                </div>
                <button onClick={handleTextSave} disabled={savingText} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">
                    <Save size={16} /> {savingText ? 'Сохранение...' : 'Сохранить все'}
                </button>
            </div>

            <div className="space-y-12 pb-24">
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-8">
                    <h3 className="text-sm font-light uppercase tracking-widest border-b border-white/5 pb-4">Слайд 1: Заголовки и Текст</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" value={textContent.slide1_text1} onChange={e => setTextContent({...textContent, slide1_text1: e.target.value})} placeholder="Левая колонка" />
                        <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" value={textContent.slide1_text2} onChange={e => setTextContent({...textContent, slide1_text2: e.target.value})} placeholder="Правая колонка" />
                    </div>
                </section>

                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
                    <h3 className="text-sm font-light uppercase tracking-widest mb-6">Слайд 3: Основатель</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="aspect-[3/4] bg-white/5 rounded-xl overflow-hidden border border-white/10">
                            {textContent.slide3_photo && <img src={textContent.slide3_photo} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <input className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm" value={textContent.slide3_name} onChange={e => setTextContent({...textContent, slide3_name: e.target.value})} placeholder="Имя" />
                            <input className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm" value={textContent.slide3_role} onChange={e => setTextContent({...textContent, slide3_role: e.target.value})} placeholder="Должность" />
                            <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm" value={textContent.slide3_quote} onChange={e => setTextContent({...textContent, slide3_quote: e.target.value})} placeholder="Цитата" />
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
};

export default ManageAbout;
