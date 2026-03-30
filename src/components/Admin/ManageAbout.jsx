import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';
import {
    Plus,
    Trash2,
    Upload,
    Info,
    Check,
    AlertCircle,
    Type,
    Image as ImageIcon,
    Save,
    User,
    Award,
    Circle,
    Edit2
} from 'lucide-react';

const ManageAbout = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Text content states
    const [textContent, setTextContent] = useState({
        slide1_title: 'О СТУДИИ',
        slide1_text1: 'KIME — мастерская мультимедийных решений, где искусство встречается с технологиями. Мы создаем цифровые миры, которые вдохновляют, обучают и меняют восприятие реальности.',
        slide1_text2: 'Мы упаковываем смыслы в цифровой формат, превращая сложные идеи в интуитивно понятные и визуально захватывающие проекты. От образовательных VR-симуляций до масштабных мультимедийных инсталляций — каждый наш проект уникален.',
        slide2_title: 'НАШ ПОДХОД',
        slide2_text: 'Мы верим, что технологии должны служить идее, а не наоборот. Наш процесс построен на глубоком исследовании задачи и поиске нестандартных визуальных метафор, которые находят отклик в сердцах людей.',
        slide3_quote: '«Мы превращаем холодный программный код в живую эмоцию, создавая пространство, где границы между реальностью и воображением стираются.»',
        slide3_name: 'Александр Ким',
        slide3_role: 'Основатель & Креативный директор',
        slide3_photo: '',
        verticalOffsetMobile: -148,
        verticalOffsetDesktop: -236
    });
    const [certificates, setCertificates] = useState([]);
    const [savingText, setSavingText] = useState(false);
    const [certUploading, setCertUploading] = useState(false);
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [newCert, setNewCert] = useState({
        company: '',
        division: '',
        position: '',
        file: null
    });
    const [editingCertId, setEditingCertId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch partners
            const { data: partnersData } = await supabase
                .from('partners')
                .select('*')
                .order('order_index', { ascending: true });
            setPartners(partnersData || []);

            // Fetch text content
            const { data: settingsData } = await supabase
                .from('site_content')
                .select('*')
                .eq('section_key', 'about_page')
                .single();

            if (settingsData) {
                setTextContent(prev => ({ ...prev, ...settingsData.content_json }));
            }

            // Fetch certificates
            const { data: certsData } = await supabase
                .from('certificates')
                .select('*')
                .order('order_index', { ascending: true });
            setCertificates(certsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTextSave = async () => {
        setSavingText(true);
        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    section_key: 'about_page',
                    content_json: textContent,
                    updated_at: new Date()
                }, { onConflict: 'section_key' });

            if (error) throw error;
            alert('Контент успешно сохранен!');
        } catch (error) {
            alert('Ошибка при сохранении: ' + error.message);
        } finally {
            setSavingText(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `partner_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('partners')
                .upload(filePath, file);

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error('Storage Bucket "partners" не найден. Пожалуйста, создайте его в Supabase и сделайте Public.');
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('partners')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('partners')
                .insert([{
                    name: file.name.split('.')[0],
                    logo_url: publicUrl,
                    order_index: partners.length
                }]);

            if (dbError) throw dbError;
            
            fetchData();
        } catch (error) {
            alert('Ошибка при загрузке: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleFounderPhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `founder_${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('SEO')
                .upload(fileName, file);

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error('Storage Bucket "partners" не найден. Пожалуйста, создайте его в Supabase и сделайте Public.');
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('SEO')
                .getPublicUrl(fileName);

            setTextContent(prev => ({ ...prev, slide3_photo: publicUrl }));
            alert('Фото основателя загружено. Не забудьте сохранить изменения!');
        } catch (error) {
            alert('Ошибка при загрузке: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePartner = async (partner) => {
        if (!window.confirm(`Удалить логотип "${partner.name}"?`)) return;

        try {
            const urlParts = partner.logo_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            await supabase.storage.from('partners').remove([fileName]);

            const { error } = await supabase
                .from('partners')
                .delete()
                .eq('id', partner.id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Ошибка при удалении: ' + error.message);
        }
    };

    const handleAddCertificate = async () => {
        // Validation: if not editing, file is required. If editing, file is optional.
        if (!newCert.company || (!editingCertId && !newCert.file)) {
            alert('Необходимо указать компанию' + (editingCertId ? '' : ' и выбрать файл'));
            return;
        }

        setCertUploading(true);
        try {
            let publicUrl = null;

            if (newCert.file) {
                const fileExt = newCert.file.name.split('.').pop();
                const fileName = `cert_${Math.random()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('Achievements')
                    .upload(fileName, newCert.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl: url } } = supabase.storage
                    .from('Achievements')
                    .getPublicUrl(fileName);
                publicUrl = url;
            }

            const certData = {
                company: newCert.company,
                division: newCert.division,
                position: newCert.position,
                order_index: editingCertId ? undefined : certificates.length
            };

            if (publicUrl) {
                certData.image_url = publicUrl;
            }

            const { error: dbError } = editingCertId
                ? await supabase.from('certificates').update(certData).eq('id', editingCertId)
                : await supabase.from('certificates').insert([certData]);

            if (dbError) throw dbError;
            
            setIsCertModalOpen(false);
            setEditingCertId(null);
            setNewCert({ company: '', division: '', position: '', file: null });
            fetchData();
        } catch (error) {
            alert('Ошибка при сохранении грамоты: ' + error.message);
        } finally {
            setCertUploading(false);
        }
    };

    const handleEditCertificate = (cert) => {
        setNewCert({
            company: cert.company,
            division: cert.division || '',
            position: cert.position || '',
            file: null
        });
        setEditingCertId(cert.id);
        setIsCertModalOpen(true);
    };

    const handleDeleteCertificate = async (cert) => {
        if (!window.confirm('Удалить эту грамоту?')) return;

        try {
            const urlParts = cert.image_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            await supabase.storage.from('Achievements').remove([fileName]);

            const { error } = await supabase
                .from('certificates')
                .delete()
                .eq('id', cert.id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Ошибка при удалении: ' + error.message);
        }
    };

    return (
        <AdminLayout>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-thin tracking-widest uppercase mb-2">О студии</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Управление структурой страницы "About" (Слайды 1-4)</p>
                </div>
                <button
                    onClick={handleTextSave}
                    disabled={savingText}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <Save size={16} />
                    {savingText ? 'Сохранение...' : 'Сохранить все изменения'}
                </button>
            </div>

            <div className="space-y-12 pb-24">
                {/* SLIDE 1: MAIN INFO & PARTNERS */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-white/[0.02] px-8 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">01</span>
                            <h3 className="text-sm font-light uppercase tracking-widest">Основная информация и Партнеры</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-10">
                        {/* Text Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Заголовок Слайда</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                        value={textContent.slide1_title}
                                        onChange={e => setTextContent({ ...textContent, slide1_title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Описание (Левая колонка)</label>
                                    <textarea
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors resize-none"
                                        value={textContent.slide1_text1}
                                        onChange={e => setTextContent({ ...textContent, slide1_text1: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Описание (Правая колонка / Техническое)</label>
                                    <textarea
                                        className="w-full h-44 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors resize-none"
                                        value={textContent.slide1_text2}
                                        onChange={e => setTextContent({ ...textContent, slide1_text2: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visual Positioning */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6 text-gray-400">
                                <Plus size={16} className="rotate-45" />
                                <h4 className="text-[10px] uppercase tracking-widest font-medium">Позиционирование контента</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[9px] uppercase tracking-widest text-gray-500">Сдвиг (Desktop)</label>
                                        <span className="text-[10px] font-mono text-white/50">{textContent.verticalOffsetDesktop}px</span>
                                    </div>
                                    <input type="range" min="-600" max="600" step="1" className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                                        value={textContent.verticalOffsetDesktop}
                                        onChange={e => setTextContent({ ...textContent, verticalOffsetDesktop: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[9px] uppercase tracking-widest text-gray-500">Сдвиг (Mobile)</label>
                                        <span className="text-[10px] font-mono text-white/50">{textContent.verticalOffsetMobile}px</span>
                                    </div>
                                    <input type="range" min="-600" max="600" step="1" className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                                        value={textContent.verticalOffsetMobile}
                                        onChange={e => setTextContent({ ...textContent, verticalOffsetMobile: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Partner Logos */}
                        <div className="pt-10 border-t border-white/5">
                            <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-6 font-bold">Партнеры (Логотипы)</label>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                                {/* Upload Button */}
                                <div className="relative bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl aspect-square flex flex-col items-center justify-center hover:border-white/30 transition-all cursor-pointer group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                    />
                                    <Plus className={`text-gray-500 group-hover:text-white transition-colors ${uploading ? 'animate-spin' : ''}`} />
                                    <span className="text-[8px] uppercase tracking-[0.2em] text-gray-600 mt-2 group-hover:text-gray-400">Загрузить</span>
                                </div>
                                
                                {partners.map(partner => (
                                    <div key={partner.id} className="group relative bg-[#111] border border-white/5 rounded-xl p-4 aspect-square flex items-center justify-center hover:border-white/20 transition-all">
                                        <img src={partner.logo_url} alt={partner.name} className="max-w-full max-h-full object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <button 
                                            onClick={() => handleDeletePartner(partner)}
                                            className="absolute top-1 right-1 p-1.5 bg-red-500/10 text-red-500 opacity-40 group-hover:opacity-100 rounded-md hover:bg-red-500 transition-all hover:text-white"
                                            title="Удалить логотип"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0">
                                    <Info size={20} className="text-gray-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold">Требования к логотипам:</p>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">
                                        Формат: <b className="text-gray-300">SVG</b> или <b className="text-gray-300">PNG</b> с прозрачным фоном. 
                                        Цвет: <b className="text-gray-300">Белый/Светлый</b>. 
                                        Оптимальная высота: <b className="text-gray-300">60-80px</b>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SLIDE 2: APPROACH */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-white/[0.02] px-8 py-4 border-b border-white/5 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">02</span>
                        <h3 className="text-sm font-light uppercase tracking-widest">Наш подход</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div>
                            <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Заголовок</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                value={textContent.slide2_title}
                                onChange={e => setTextContent({ ...textContent, slide2_title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Текст</label>
                            <textarea
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors resize-none"
                                value={textContent.slide2_text}
                                onChange={e => setTextContent({ ...textContent, slide2_text: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                {/* SLIDE 3: FOUNDER */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-white/[0.02] px-8 py-4 border-b border-white/5 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">03</span>
                        <h3 className="text-sm font-light uppercase tracking-widest">Основатель (Vision & Leadership)</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Photo Management */}
                        <div className="lg:col-span-4 space-y-4">
                            <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Фотогорафия основателя</label>
                            <div className="relative aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10 group">
                                <img src={textContent.slide3_photo} alt="Founder" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 text-center">
                                    <p className="text-[10px] text-white/70 uppercase tracking-widest mb-2">Нажмите чтобы заменить</p>
                                    <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors">
                                        <Upload size={14} className="inline mr-2" />
                                        Заменить фото
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFounderPhotoUpload} />
                                    </label>
                                    <button
                                        onClick={() => { if (window.confirm('Удалить фото?')) setTextContent(prev => ({ ...prev, slide3_photo: '' })) }}
                                        className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                                    >
                                        Удалить текущее
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Text Fields */}
                        <div className="lg:col-span-8 space-y-6 flex flex-col justify-center">
                            <div>
                                <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Цитата</label>
                                <textarea
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg italic font-light focus:outline-none focus:border-white/30 transition-colors resize-none"
                                    value={textContent.slide3_quote}
                                    onChange={e => setTextContent({ ...textContent, slide3_quote: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Имя</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm font-medium focus:outline-none focus:border-white/30 transition-colors"
                                        value={textContent.slide3_name}
                                        onChange={e => setTextContent({ ...textContent, slide3_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Должность</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                        value={textContent.slide3_role}
                                        onChange={e => setTextContent({ ...textContent, slide3_role: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SLIDE 4: CERTIFICATES */}
                <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-white/[0.02] px-8 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">04</span>
                            <h3 className="text-sm font-light uppercase tracking-widest">Достижения (Грамоты)</h3>
                        </div>
                        <button
                            onClick={() => setIsCertModalOpen(true)}
                            className="bg-white text-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
                        >
                            + Добавить грамоту
                        </button>
                    </div>

                    <div className="p-8">
                        {certificates.length === 0 ? (
                            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-12 text-center">
                                <Award size={48} className="text-white/10 mx-auto mb-4" />
                                <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">Список грамот пуст</p>
                                <p className="text-gray-600 text-[10px] italic max-w-sm mx-auto">
                                    Добавьте первую грамоту, чтобы она отобразилась на сайте.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {certificates.map(cert => (
                                    <div key={cert.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden group">
                                        <div className="aspect-[210/297] bg-[#111] relative border-b border-white/5">
                                            <img src={cert.image_url} alt={cert.company} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <button
                                                    onClick={() => handleEditCertificate(cert)}
                                                    className="p-2 bg-white/10 text-white opacity-40 group-hover:opacity-100 rounded-lg hover:bg-white transition-all hover:text-black"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCertificate(cert)}
                                                    className="p-2 bg-red-500/10 text-red-500 opacity-40 group-hover:opacity-100 rounded-lg hover:bg-red-500 transition-all hover:text-white"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-2">
                                            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider line-clamp-1">{cert.company}</h4>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest line-clamp-1">{cert.division}</p>
                                            <p className="text-[8px] text-gray-600 uppercase italic line-clamp-1">{cert.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Certificate Add Modal */}
            {isCertModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm uppercase tracking-widest font-bold">
                                {editingCertId ? 'Редактировать грамоту' : 'Новая грамота'}
                            </h3>
                            <button onClick={() => { setIsCertModalOpen(false); setEditingCertId(null); setNewCert({company:'', division:'', position:'', file:null}); }} className="text-gray-500 hover:text-white transition-colors">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Компания/Организация</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder="Например: РЖД"
                                    value={newCert.company}
                                    onChange={e => setNewCert({ ...newCert, company: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">Подразделение</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs focus:outline-none focus:border-white/30 transition-colors"
                                        placeholder="ВНИИЖТ"
                                        value={newCert.division}
                                        onChange={e => setNewCert({ ...newCert, division: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2">ФИО / Должность</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs focus:outline-none focus:border-white/30 transition-colors"
                                        placeholder="Павлов А.А."
                                        value={newCert.position}
                                        onChange={e => setNewCert({ ...newCert, position: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Файл грамоты (Изображение)</label>
                                <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-white/30 transition-colors cursor-pointer group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => setNewCert({ ...newCert, file: e.target.files[0] })}
                                    />
                                    {newCert.file ? (
                                        <div className="text-white text-xs font-medium">{newCert.file.name}</div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto mb-2 text-gray-600 group-hover:text-white transition-colors" size={24} />
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Выберите файл</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleAddCertificate}
                                disabled={certUploading}
                                className="w-full bg-white text-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {certUploading ? 'Загрузка...' : (editingCertId ? 'Сохранить изменения' : 'Добавить грамоту')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Save Button (Mobile) */}
            <div className="fixed bottom-8 right-8 z-50 md:hidden">
                <button
                    onClick={handleTextSave}
                    disabled={savingText}
                    className="w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center disabled:opacity-50"
                >
                    <Save size={24} />
                </button>
            </div>
        </AdminLayout>
    );
};

export default ManageAbout;
