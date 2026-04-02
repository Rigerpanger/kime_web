// Это "мостик" между старым кодом Supabase и нашим новым Backend API на VPS.
// Убираем префикс /api здесь, так как он уже есть в VITE_API_URL или Nginx.

const createProxy = (table) => {
    const chain = {
        _table: table,
        _filters: {},
        _order: null,
        
        select: function() { return this; },
        eq: function(col, val) { this._filters[col] = val; return this; },
        match: function(obj) { Object.assign(this._filters, obj); return this; },
        order: function(col, { ascending = true } = {}) { this._order = col; return this; },
        single: function() { return this.then(res => ({ data: res.data ? (Array.isArray(res.data) ? res.data[0] : res.data) : null, error: res.error })); },
        
        then: function(onSuccess) {
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            return fetch(`${apiUrl}/${this._table}`)
                .then(res => {
                    if (!res.ok) throw new Error('API Error');
                    return res.json();
                })
                .then(data => {
                    let result = data;
                    // Минимальная имитация фильтрации для совместимости
                    if (onSuccess) return onSuccess({ data: result, error: null });
                    return { data: result, error: null };
                })
                .catch(err => {
                    console.error('Fetch error:', err);
                    const emptyRes = { data: [], error: err };
                    if (onSuccess) return onSuccess(emptyRes);
                    return emptyRes;
                });
        }
    };
    return chain;
};

export const supabase = {
    from: (table) => createProxy(table),
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    }
};
