'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Package, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand?: string;
  tags: string[];
  sku: string;
  inStock: boolean;
  imageUrl?: string;
  rating?: number;
  score: number;
  highlights?: {
    name?: string[];
    description?: string[];
  };
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: { value: number };
  took: number;
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
  };
}

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [took, setTook] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const categories = ['Electronics', 'Computers', 'Audio', 'Gaming', 'Automotive', 'Tablets', 'Home Appliances', 'Kitchen', 'Toys', 'Computer Components'];
  const brands = ['Apple', 'Samsung', 'Sony', 'Nintendo', 'Tesla', 'Dyson', 'Instant Pot', 'Lego', 'NVIDIA'];

  const searchProducts = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        size: '12',
        from: ((pageNum - 1) * 12).toString(),
      });

      if (category) params.append('category', category);
      if (brand) params.append('brand', brand);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (inStock !== undefined) params.append('inStock', inStock.toString());

      const response = await fetch(`/api/products/search?${params}`);
      const data = await response.json();

      if (response.ok) {
        const searchResponse = data as SearchResponse;
        setResults(searchResponse.results);
        setTotal(searchResponse.total.value);
        setTook(searchResponse.took);
      } else {
        console.error('Search error:', data.error || 'Unknown error');
        setResults([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Search request failed:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [category, brand, minPrice, maxPrice, inStock]);

  // Function to fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(searchQuery)}&size=5`);
      const data = await response.json();

      if (response.ok) {
        const suggestionTexts = data.suggestions.map((s: any) => s.text);
        setSuggestions(suggestionTexts);
        setShowSuggestions(suggestionTexts.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Suggestions request failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query) {
        searchProducts(query, page);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, page, searchProducts]);

  // Separate effect for suggestions with shorter debounce
  useEffect(() => {
    const suggestionsTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);

    return () => clearTimeout(suggestionsTimer);
  }, [query, fetchSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setShowSuggestions(false);
    searchProducts(query, 1);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setPage(1);
    searchProducts(suggestion, 1);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && query.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const clearFilters = () => {
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(undefined);
    setPage(1);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const renderHighlight = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text;
    
    const highlight = highlights[0];
    return <span dangerouslySetInnerHTML={{ __html: highlight }} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Search</h1>
          <p className="text-gray-600">Search through our demo product catalog using Elasticsearch</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg ${
                        index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-900' : ''
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 bg-white p-6 rounded-lg shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>

            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  value={inStock === undefined ? '' : inStock.toString()}
                  onChange={(e) => setInStock(e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Products</option>
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Info */}
            {query && (
              <div className="mb-4 text-sm text-gray-600">
                {loading ? (
                  'Searching...'
                ) : (
                  `Found ${total} results for "${query}" in ${took}ms`
                )}
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                          {renderHighlight(product.name, product.highlights?.name)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{product.brand} • {product.category}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {product.rating && (
                          <>
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{product.rating}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {renderHighlight(product.description, product.highlights?.description)}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-xl font-bold text-green-600">
                          ${product.price.toLocaleString()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {product.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{product.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>SKU: {product.sku}</span>
                      <span>Score: {product.score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!loading && query && results.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search terms or filters</p>
              </div>
            )}

            {/* Pagination */}
            {total > 12 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.min(Math.ceil(total / 12), page + 2))
                  .map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;
