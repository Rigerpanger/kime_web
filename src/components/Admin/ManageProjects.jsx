import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AdminLayout from './AdminLayout';
import { motion, Reorder } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  GripVertical
} from 'lucide-react';

const ManageProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const { session } = useAuthStore();
    
    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    const [formData, setFormData] = useState({
        title: '',
        client: '',
        slug: '',
        tags: '',
        cover: '',
        video_url: '',
        short_description: '',
        challenge: '',
        solution: '',
        result: '',
        tech: ''
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/projects`);
            if (response.ok) {
                const data = await response.json();
                setProjects(data || []);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (project = null) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                title: project.title || '',
                client: project.client || '',
                slug: project.slug || '',
                tags: project.tags?.join(', ') || '',
                cover: project.cover || '',
                video_url: project.video_url || '',
                short_description: project.short_description || '',
                challenge: project.challenge || '',
                solution: project.solution || '',
                result: project.result || '',
                tech: project.tech?.join(', ') || ''
            });
        } else {
            setEditingProject(null);
            setFormData({
                title: '', client: '', slug: '', tags: '', cover: '',
                video_url: '', short_description: '', challenge: '',
                solution: '', result: '', tech: ''
            });
        }
        setIsModalOpen(true);
    };

    const saveOrder = async (newProjects) => {
        setProjects(newProjects);
        // В локальной БД мы можем реализовать массовое обновление, 
        // но для начала оставим так или добавим эндпоинт позже
    };

    const handleDelete = async (project) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот проект?')) return;
        
        try {
            const response = await fetch(`${apiUrl}/projects/${project.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.token}` }
            });
            if (response.ok) fetchProjects();
            else alert('Ошибка при удалении');
        } catch (err) {
            console.error(err);
        }
    };

    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const uploadImage = async (file) => {
        setUploading(true);
        const data = new FormData();
        data.append('image', file);

        const response = await fetch(`${apiUrl}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.token}` },
            body: data
        });

        const resData = await response.json();
        setUploading(false);
        
        if (!response.ok) throw new Error(resData.error || 'Upload failed');
        return apiUrl + resData.url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalCoverUrl = formData.cover;
            if (selectedFile) {
                finalCoverUrl = await uploadImage(selectedFile);
            }

            const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const projectData = {
                ...formData,
                slug,
                cover: finalCoverUrl,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                tech: formData.tech.split(',').map(t => t.trim()).filter(t => t),
                sort_order: editingProject ? editingProject.sort_order : projects.length
            };

            const method = editingProject ? 'PUT' : 'POST';
            const url = editingProject ? `${apiUrl}/projects/${editingProject.id}` : `${apiUrl}/projects`;

            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.token}` 
                },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setSelectedFile(null);
                fetchProjects();
            } else {
                const err = await response.json();
                alert('Ошибка: ' + err.error);
            }
        } catch (err) {
            alert('Ошибка: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-3xl font-thin tracking-widest uppercase mb-2">Проекты</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Управление кейсами на вашем сервере</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-gray-200 transition-colors">
                    <Plus size={16} /> Добавить проект
                </button>
            </div>

            {loading && projects.length === 0 ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-[1px] bg-white animate-pulse" /></div>
            ) : (
                <Reorder.Group axis="y" values={projects} onReorder={saveOrder} className="grid grid-cols-1 gap-4">
                    {projects.map((project) => (
                        <Reorder.Item key={project.id} value={project} className="bg-[#111] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-colors pointer-events-auto">
                            <GripVertical className="text-gray-600 group-hover:text-white/40 transition-colors shrink-0" size={20} />
                            <div className="w-full md:w-32 aspect-video md:aspect-square bg-white/5 rounded-lg overflow-hidden shrink-0">
                                {project.cover && <img src={project.cover} alt="" className="w-full h-full object-cover opacity-60" />}
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-lg font-light tracking-wide mb-1 uppercase">{project.title}</h3>
                                <p className="text-[10px] text-gray-500 mb-3 tracking-widest uppercase">Slug: {project.slug}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleOpenModal(project)} className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Pencil size={18} /></button>
                                <button onClick={() => handleDelete(project)} className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"><Trash2 size={18} /></button>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-[#0a0a0a] z-10 px-8 py-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-lg font-light uppercase tracking-widest">{editingProject ? 'Редактировать' : 'Новый проект'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <input required placeholder="Название" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    <input placeholder="Slug" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})} />
                                    <input placeholder="Теги (через запятую)" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                                    <div className="space-y-3">
                                        <label className="flex-grow cursor-pointer bg-white/5 border border-white/10 border-dashed rounded-lg px-4 py-3 text-center text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/10 transition-colors">
                                            {uploading ? 'Загрузка...' : (selectedFile ? 'Файл выбран' : 'Загрузить обложку')}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                        <input placeholder="Или URL обложки" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] text-gray-500 focus:outline-none focus:border-white/30" value={formData.cover} onChange={e => setFormData({...formData, cover: e.target.value})} />
                                        <input placeholder="Ссылка на видео (Kinoiscope/Vimeo)" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <input placeholder="Заказчик" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
                                    <textarea placeholder="Краткое описание" className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none" value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} />
                                    <textarea placeholder="Задача" className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none" value={formData.challenge} onChange={e => setFormData({...formData, challenge: e.target.value})} />
                                    <textarea placeholder="Решение" className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none" value={formData.solution} onChange={e => setFormData({...formData, solution: e.target.value})} />
                                    <textarea placeholder="Результат" className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none" value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} />
                                    <input placeholder="Технологии (через запятую)" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30" value={formData.tech} onChange={e => setFormData({...formData, tech: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-white/5">
                                <button type="submit" disabled={loading} className="flex-grow bg-white text-black text-xs uppercase tracking-widest font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 bg-white/5 text-gray-400 text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-white/10 transition-colors">Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default ManageProjects;
