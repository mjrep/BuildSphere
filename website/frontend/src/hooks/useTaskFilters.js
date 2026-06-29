import { useState, useCallback } from 'react';
import { SORT_OPTIONS } from '../utils/taskConstants';

/**
 * Manages search, sort, and filter state.
 * Returns state + a query params object ready to pass to getTasks().
 */
export default function useTaskFilters() {
    const [search, setSearch]       = useState('');
    const [sort, setSort]           = useState('newest');
    const [filters, setFilters]     = useState({
        assigned_to: '',
        created_by:  '',
        priority:    '',
        status:      '',
        start_date:  '',
        end_date:    '',
    });
    const [page, setPage]           = useState(1);

    const setFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset page on filter change
    }, []);

    const resetFilters = useCallback(() => {
        setSearch('');
        setSort('newest');
        setFilters({
            assigned_to: '', created_by: '',
            priority: '', status: '', start_date: '', end_date: '',
        });
        setPage(1);
    }, []);

    // Build query params, stripping empty values
    const toQueryParams = useCallback(() => {
        const params = { sort, page, per_page: 10 };
        if (search) params.search = search;
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) params[k] = v;
        });
        return params;
    }, [search, sort, filters, page]);

    const hasActiveFilters = Object.values(filters).some(v => v !== '') || search !== '';

    return {
        search, setSearch: (v) => { setSearch(v); setPage(1); },
        sort, setSort: (v) => { setSort(v); setPage(1); },
        filters, setFilter,
        resetFilters,
        toQueryParams,
        hasActiveFilters,
        sortOptions: SORT_OPTIONS,
        page, setPage,
    };
}
