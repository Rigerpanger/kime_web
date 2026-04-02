// Это "мостик" между старым кодом Supabase и нашим новым Backend API на VPS.
// Он позволяет сайту работать без переписывания всех компонентов.

const API_URL = '/api';

const createProxy = (table) => {
    const chain = {
        _table: table,
        _filters: {},
        _order: null,
        
        select: function() { return this; },
        eq: function(col, val) { this._filters[col] = val; return this; },
        match: function(obj) { Object.assign(this._filters, obj); return this; },
        order: function(col, { ascending = true } = {}) { this._order = col; return this; },
        single: function() { return this.then(res => ({ data: res.data[0], error: res.error })); },
        
        then: function(onSuccess) {
            return fetch(`${API_URL}/${this._table}`)
                .then(res => res.json())
                .then(data => {
                    // Простейшая фильтрация для совместимости
                    let result = Array.isArray(data) ? data : [data];
                    if (onSuccess) return onSuccess({ data: result, error: null });
                    return { data: result, error: null };
                })
                .catch(err => ({ data: [], error: err }));
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
