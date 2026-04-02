// Этот файл теперь возвращает "заглушку", чтобы сайт не падал без Supabase.
// В будущем мы перепишем запросы на наш новый API.
export const supabase = {
    from: () => ({
        select: () => Promise.resolve({ data: [], error: null, count: 0 }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
    }),
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
};
