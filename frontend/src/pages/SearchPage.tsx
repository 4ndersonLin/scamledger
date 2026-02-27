import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { Address, Chain, ScamType, ApiResponse, ApiMeta } from '@cryptoscam/shared';
import { DEFAULT_PAGE_SIZE } from '@cryptoscam/shared';
import { api } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { usePageMeta } from '../hooks/usePageMeta';
import SearchBar from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import ResultCard from '../components/search/ResultCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';

interface SearchData {
  addresses: Address[];
}

type SearchResponse = ApiResponse<SearchData> & { meta?: ApiMeta };

export default function SearchPage(): React.ReactElement {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Investigate — Search Threat Addresses',
    description:
      'Search known cryptocurrency scam and hack addresses. Filter by blockchain, scam type, and risk level.',
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [chain, setChain] = useState<Chain | undefined>(
    (searchParams.get('chain') as Chain) || undefined,
  );
  const [scamType, setScamType] = useState<ScamType | undefined>(
    (searchParams.get('scam_type') as ScamType) || undefined,
  );
  const [sort, setSort] = useState<'newest' | 'risk' | 'reports'>(
    (searchParams.get('sort') as 'newest' | 'risk' | 'reports') || 'newest',
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const [results, setResults] = useState<Address[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const buildSearchPath = useCallback((): string => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (chain) params.set('chain', chain);
    if (scamType) params.set('scam_type', scamType);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', String(DEFAULT_PAGE_SIZE));
    return `/search?${params.toString()}`;
  }, [debouncedQuery, chain, scamType, sort, page]);

  const fetchResults = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const path = buildSearchPath();
      const result = (await api.get<SearchData>(path)) as SearchResponse;
      if (result.success) {
        setResults(result.data.addresses);
        setTotalResults(result.meta?.total ?? 0);
        setTotalPages(result.meta?.total_pages ?? 0);
      } else {
        setResults([]);
        setTotalResults(0);
        setTotalPages(0);
      }
    } catch {
      setResults([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [buildSearchPath]);

  useEffect(() => {
    void fetchResults();
  }, [fetchResults]);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (chain) params.set('chain', chain);
    if (scamType) params.set('scam_type', scamType);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, chain, scamType, sort, page, setSearchParams]);

  const handleSearch = (q: string): void => {
    setQuery(q);
    setPage(1);
  };

  const handleChainChange = (c: Chain | undefined): void => {
    setChain(c);
    setPage(1);
  };

  const handleScamTypeChange = (s: ScamType | undefined): void => {
    setScamType(s);
    setPage(1);
  };

  const handleSortChange = (s: 'newest' | 'risk' | 'reports'): void => {
    setSort(s);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">
        {t('search.title')}
      </h1>

      <SearchBar
        initialQuery={query}
        onSearch={handleSearch}
        placeholder={t('search.searchPlaceholder')}
      />

      <SearchFilters
        chain={chain}
        scamType={scamType}
        sort={sort}
        onChainChange={handleChainChange}
        onScamTypeChange={handleScamTypeChange}
        onSortChange={handleSortChange}
      />

      {/* Results count */}
      {!loading && totalResults > 0 && (
        <p className="text-sm text-slate-400">
          {new Intl.NumberFormat('en-US').format(totalResults)} {t('search.results')}
        </p>
      )}

      {/* Results list */}
      {loading ? (
        <LoadingSpinner />
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((addr) => (
            <ResultCard key={`${addr.chain}-${addr.address}`} address={addr} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">{t('search.noResults')}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-navy-800 border border-navy-600 rounded text-sm font-heading uppercase tracking-wider text-slate-300 hover:text-white hover:border-navy-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('report.prev')}
          </button>
          <span className="text-sm text-slate-400 font-mono">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-navy-800 border border-navy-600 rounded text-sm font-heading uppercase tracking-wider text-slate-300 hover:text-white hover:border-navy-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('report.next')}
          </button>
        </div>
      )}
    </div>
  );
}
