import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('sort_order', { ascending: true });
        
        if (error) console.error('Error fetching projects:', error);
        else setProjects(data || []);
        setLoading(false);
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
        }
        setIsModalOpen(true);
    };

    const saveOrder = async (newProjects) => {
        const oldProjects = [...projects];
        setProjects(newProjects);
        
        try {
            // Update each project's order individually to avoid "not-null" constraints on other columns
            const updatePromises = newProjects.map((p, index) => 
                supabase
                    .from('projects')
                    .update({ sort_order: index })
                    .eq('id', p.id)
            );

            const results = await Promise.all(updatePromises);
            const firstError = results.find(r => r.error);

            if (firstError) {
                console.error('Error saving order:', firstError.error);
                alert('Не удалось сохранить порядок: ' + firstError.error.message);
                setProjects(oldProjects);
            } else {
                console.log('Order saved successfully');
            }
        } catch (err) {
            console.error('Catch error in saveOrder:', err);
            alert('Сетевая ошибка при сохранении порядка');
            setProjects(oldProjects);
        }
    };

    const handleDelete = async (project) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот проект?')) return;
        
        // Try to delete from storage if it's a Supabase storage URL
        if (project.cover && project.cover.includes('project-covers')) {
            try {
                const urlParts = project.cover.split('/');
                const fileName = urlParts[urlParts.length - 1];
                await supabase.storage.from('project-covers').remove([fileName]);
            } catch (err) {
                console.error('Error deleting image from storage:', err);
            }
        }

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id);
        
        if (error) alert('Ошибка при удалении: ' + error.message);
        else fetchProjects();
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
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
            .from('project-covers')
            .upload(filePath, file);

        if (uploadError) {
            setUploading(false);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('project-covers')
            .getPublicUrl(filePath);

        setUploading(false);
        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalCoverUrl = formData.cover;

            if (selectedFile) {
                finalCoverUrl = await uploadImage(selectedFile);
            }

            // Auto-generate slug if empty
            const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');

            const projectData = {
                ...formData,
                slug,
                cover: finalCoverUrl,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                tech: formData.tech.split(',').map(t => t.trim()).filter(t => t)
            };

            let error;
            if (editingProject) {
                const { error: err } = await supabase
                    .from('projects')
                    .update(projectData)
                    .eq('id', editingProject.id);
                error = err;
            } else {
                // For new projects, put them at the end
                projectData.sort_order = projects.length;
                const { error: err } = await supabase
                    .from('projects')
                    .insert([projectData]);
                error = err;
            }

            if (error) {
                alert('Ошибка при сохранении: ' + error.message);
            } else {
                setIsModalOpen(false);
                setSelectedFile(null);
                fetchProjects();
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
                    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Управление кейсами в портфолио</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-gray-200 transition-colors"
                >
                    <Plus size={16} />
                    Добавить проект
                </button>
            </div>

            {loading && projects.length === 0 ? (
                <div className="py-20 flex justify-center">
                    <div className="w-8 h-[1px] bg-white animate-pulse" />
                </div>
            ) : (
                <Reorder.Group axis="y" values={projects} onReorder={saveOrder} className="grid grid-cols-1 gap-4">
                    {projects.map((project) => (
                        <Reorder.Item 
                            key={project.id} 
                            value={project}
                            dragListener={true}
                            className="bg-[#111] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-colors cursor-grab active:cursor-grabbing"
                        >
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <GripVertical className="text-gray-600 group-hover:text-white/40 transition-colors" size={20} />
                                <div className="w-full md:w-32 aspect-video md:aspect-square bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                                    {project.cover ? (
                                        <img src={project.cover} alt="" className="w-full h-full object-cover opacity-60" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/10 italic text-xs">No cover</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-lg font-light tracking-wide mb-1 uppercase">{project.title}</h3>
                                <p className="text-[10px] text-gray-500 mb-3 tracking-widest uppercase">Slug: {project.slug || '—'}</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {project.tags?.map(tag => (
                                        <span key={tag} className="text-[8px] uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-gray-400 text-xs line-clamp-1 italic font-light">{project.short_description}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(project); }}
                                    className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(project); }}
                                    className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </Reorder.Item>
                    ))}

                    {projects.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl">
                            <p className="text-gray-600 text-xs uppercase tracking-widest">Список проектов пуст</p>
                        </div>
                    )}
                </Reorder.Group>
            )}

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-[#0a0a0a] z-10 px-8 py-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-lg font-light uppercase tracking-widest">
                                {editingProject ? 'Редактировать проект' : 'Новый проект'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Название</label>
                                        <input 
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                                            value={formData.title}
                                            onChange={e => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">URL-адрес (Slug)</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                                            placeholder="например: yamaguchi"
                                            value={formData.slug}
                                            onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Заказчик</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                                            value={formData.client}
                                            onChange={e => setFormData({...formData, client: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Теги (через запятую)</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                                            placeholder="AR, VR, Web"
                                            value={formData.tags}
                                            onChange={e => setFormData({...formData, tags: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Обложка</label>
                                        <div className="space-y-3">
                                            {(selectedFile || formData.cover) && (
                                                <div className="w-full aspect-video bg-white/5 rounded-lg overflow-hidden border border-white/10 relative group">
                                                    <img 
                                                        src={selectedFile ? URL.createObjectURL(selectedFile) : formData.cover} 
                                                        alt="preview" 
                                                        className="w-full h-full object-cover opacity-60"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                        <ImageIcon className="text-white/50" size={32} />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <label className="flex-grow cursor-pointer bg-white/5 border border-white/10 border-dashed rounded-lg px-4 py-3 text-center text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/10 transition-colors">
                                                    {uploading ? 'Загрузка...' : (selectedFile ? 'Сменить файл' : 'Загрузить файл')}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                                {formData.cover && !selectedFile && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({...formData, cover: ''})}
                                                        className="px-4 border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] text-gray-500 focus:outline-none focus:border-white/30"
                                                placeholder="Или вставьте URL вручную"
                                                value={formData.cover}
                                                onChange={e => setFormData({...formData, cover: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Видео (URL/Iframe src)</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                                            value={formData.video_url}
                                            onChange={e => setFormData({...formData, video_url: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Технологии (через запятую)</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                                            placeholder="React, Three.js, GSAP"
                                            value={formData.tech}
                                            onChange={e => setFormData({...formData, tech: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Краткое описание</label>
                                        <textarea 
                                            className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none"
                                            value={formData.short_description}
                                            onChange={e => setFormData({...formData, short_description: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Задача</label>
                                        <textarea 
                                            className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none"
                                            value={formData.challenge}
                                            onChange={e => setFormData({...formData, challenge: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Решение</label>
                                        <textarea 
                                            className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none"
                                            value={formData.solution}
                                            onChange={e => setFormData({...formData, solution: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Результат</label>
                                        <textarea 
                                            className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 resize-none"
                                            value={formData.result}
                                            onChange={e => setFormData({...formData, result: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-white/5">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-grow bg-white text-black text-xs uppercase tracking-widest font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 bg-white/5 text-gray-400 text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default ManageProjects;
