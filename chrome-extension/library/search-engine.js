class ComponentSearchEngine {
  constructor() {
    this.index = null;
    this.searchConfiguration = null;
    this.searchHistory = [];
    this.popularSearches = new Map();
  }

  async initialize(libraryIndex) {
    this.index = libraryIndex;
    this.searchConfiguration = libraryIndex.searchConfiguration || this.getDefaultSearchConfig();
    this.buildSearchIndex();
  }

  getDefaultSearchConfig() {
    return {
      fieldWeights: {
        name: 10,
        'taxonomy.advertiser': 8,
        'taxonomy.adUnitType': 6,
        description: 4,
        'demoContext.keyFeatures': 3,
        searchTerms: 2
      },
      fuzzySearch: {
        enabled: true,
        threshold: 0.6
      },
      stemming: {
        enabled: true,
        language: 'english'
      }
    };
  }

  buildSearchIndex() {
    if (!this.index || !this.index.components) {
      console.warn('No components found to index');
      return;
    }

    this.searchIndex = this.index.components.map(component => ({
      ...component,
      searchableText: this.buildSearchableText(component),
      keywords: this.extractKeywords(component)
    }));

    console.log(`Search index built with ${this.searchIndex.length} components`);
  }

  buildSearchableText(component) {
    const searchableFields = [
      component.name,
      component.description,
      component.taxonomy?.advertiser,
      component.taxonomy?.advertiserVertical,
      component.taxonomy?.publisher,
      component.taxonomy?.domainVertical,
      component.taxonomy?.adUnitType,
      component.taxonomy?.dimensions,
      ...(component.demoContext?.bestFor || []),
      ...(component.demoContext?.keyFeatures || []),
      ...(component.demoContext?.talkingPoints || []),
      ...(component.searchTerms || [])
    ];

    return searchableFields
      .filter(field => field)
      .join(' ')
      .toLowerCase();
  }

  extractKeywords(component) {
    const keywords = new Set();
    
    // Add taxonomy keywords
    if (component.taxonomy) {
      Object.values(component.taxonomy).forEach(value => {
        if (typeof value === 'string') {
          keywords.add(value.toLowerCase());
        }
      });
    }

    // Add search terms
    if (component.searchTerms) {
      component.searchTerms.forEach(term => keywords.add(term.toLowerCase()));
    }

    // Extract keywords from description
    const descriptionKeywords = this.extractKeywordsFromText(component.description);
    descriptionKeywords.forEach(keyword => keywords.add(keyword));

    return Array.from(keywords);
  }

  extractKeywordsFromText(text) {
    if (!text) return [];
    
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  search(query, filters = {}) {
    if (!this.searchIndex) {
      console.warn('Search index not initialized');
      return [];
    }

    this.recordSearch(query, filters);

    let results = [...this.searchIndex];

    // Apply filters first
    results = this.applyFilters(results, filters);

    // Apply text search if query provided
    if (query && query.trim()) {
      results = this.performTextSearch(results, query.trim());
    }

    // Sort results by relevance
    results = this.sortByRelevance(results, query);

    // Add search metadata
    results = results.map(result => ({
      ...result,
      searchMetadata: {
        relevanceScore: result._relevanceScore || 0,
        matchedFields: result._matchedFields || [],
        query: query,
        filters: filters
      }
    }));

    return results;
  }

  applyFilters(components, filters) {
    let filtered = components;

    if (filters.advertiserVertical) {
      filtered = filtered.filter(component => 
        component.taxonomy?.advertiserVertical === filters.advertiserVertical
      );
    }

    if (filters.adUnitType) {
      filtered = filtered.filter(component => 
        component.taxonomy?.adUnitType === filters.adUnitType
      );
    }

    if (filters.dimensions) {
      filtered = filtered.filter(component => 
        component.taxonomy?.dimensions === filters.dimensions
      );
    }

    if (filters.interactionLevel) {
      filtered = filtered.filter(component => 
        component.taxonomy?.interactionLevel === filters.interactionLevel
      );
    }

    if (filters.publisher) {
      const publisherLower = filters.publisher.toLowerCase();
      filtered = filtered.filter(component => 
        component.taxonomy?.publisher?.toLowerCase().includes(publisherLower) ||
        component.taxonomy?.domain?.toLowerCase().includes(publisherLower) ||
        component.taxonomy?.domainVertical?.toLowerCase().includes(publisherLower)
      );
    }

    if (filters.advertiser) {
      const advertiserLower = filters.advertiser.toLowerCase();
      filtered = filtered.filter(component => 
        component.taxonomy?.advertiser?.toLowerCase().includes(advertiserLower)
      );
    }

    return filtered;
  }

  performTextSearch(components, query) {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    return components
      .map(component => this.scoreComponent(component, queryLower, queryTerms))
      .filter(component => component._relevanceScore > 0);
  }

  scoreComponent(component, query, queryTerms) {
    let totalScore = 0;
    const matchedFields = [];

    // Exact phrase matching (highest priority)
    if (component.searchableText.includes(query)) {
      totalScore += 100;
      matchedFields.push('exact-phrase');
    }

    // Field-specific scoring
    const fieldScores = this.searchConfiguration.fieldWeights;

    // Score individual fields
    Object.entries(fieldScores).forEach(([fieldPath, weight]) => {
      const fieldValue = this.getNestedFieldValue(component, fieldPath);
      if (fieldValue) {
        const fieldScore = this.scoreField(fieldValue, queryTerms, weight);
        if (fieldScore > 0) {
          totalScore += fieldScore;
          matchedFields.push(fieldPath);
        }
      }
    });

    // Keyword matching
    const keywordScore = this.scoreKeywords(component.keywords, queryTerms);
    if (keywordScore > 0) {
      totalScore += keywordScore;
      matchedFields.push('keywords');
    }

    // Fuzzy matching if enabled
    if (this.searchConfiguration.fuzzySearch.enabled) {
      const fuzzyScore = this.performFuzzySearch(component, query);
      if (fuzzyScore > 0) {
        totalScore += fuzzyScore;
        matchedFields.push('fuzzy-match');
      }
    }

    // Boost popular components
    if (this.isPopularComponent(component.id)) {
      totalScore *= 1.2;
    }

    component._relevanceScore = totalScore;
    component._matchedFields = matchedFields;

    return component;
  }

  getNestedFieldValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  scoreField(fieldValue, queryTerms, weight) {
    if (!fieldValue) return 0;

    const fieldValueLower = String(fieldValue).toLowerCase();
    let fieldScore = 0;

    queryTerms.forEach(term => {
      if (fieldValueLower.includes(term)) {
        // Exact match gets full weight
        if (fieldValueLower === term) {
          fieldScore += weight * 2;
        }
        // Word boundary match gets full weight
        else if (new RegExp(`\\b${term}\\b`).test(fieldValueLower)) {
          fieldScore += weight;
        }
        // Partial match gets reduced weight
        else {
          fieldScore += weight * 0.5;
        }
      }
    });

    return fieldScore;
  }

  scoreKeywords(keywords, queryTerms) {
    if (!keywords || keywords.length === 0) return 0;

    let keywordScore = 0;
    queryTerms.forEach(term => {
      if (keywords.includes(term)) {
        keywordScore += 2;
      }
      // Check for partial keyword matches
      keywords.forEach(keyword => {
        if (keyword.includes(term) && keyword !== term) {
          keywordScore += 1;
        }
      });
    });

    return keywordScore;
  }

  performFuzzySearch(component, query) {
    const threshold = this.searchConfiguration.fuzzySearch.threshold;
    let maxSimilarity = 0;

    // Check similarity with name
    const nameSimilarity = this.calculateSimilarity(component.name.toLowerCase(), query);
    if (nameSimilarity > threshold) {
      maxSimilarity = Math.max(maxSimilarity, nameSimilarity);
    }

    // Check similarity with description
    const descSimilarity = this.calculateSimilarity(component.description.toLowerCase(), query);
    if (descSimilarity > threshold) {
      maxSimilarity = Math.max(maxSimilarity, descSimilarity);
    }

    return maxSimilarity > threshold ? maxSimilarity * 10 : 0;
  }

  calculateSimilarity(str1, str2) {
    // Simple Levenshtein distance-based similarity
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Calculate distances
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  sortByRelevance(components, query) {
    return components.sort((a, b) => {
      // Primary sort by relevance score
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore;
      }

      // Secondary sort by popularity
      const aPopular = this.isPopularComponent(a.id);
      const bPopular = this.isPopularComponent(b.id);
      if (aPopular !== bPopular) {
        return bPopular ? 1 : -1;
      }

      // Tertiary sort by name
      return a.name.localeCompare(b.name);
    });
  }

  isPopularComponent(componentId) {
    if (!this.index.popularComponents) return false;
    return this.index.popularComponents.includes(componentId);
  }

  getQuickFilterResults(filterType) {
    if (!this.index.quickFilters || !this.index.quickFilters[filterType]) {
      return [];
    }

    const quickFilter = this.index.quickFilters[filterType];
    return this.search('', quickFilter.criteria);
  }

  getSuggestions(partialQuery) {
    if (!partialQuery || partialQuery.length < 2) {
      return this.getPopularSuggestions();
    }

    const suggestions = new Set();
    const queryLower = partialQuery.toLowerCase();

    // Add component names that start with the query
    this.searchIndex.forEach(component => {
      if (component.name.toLowerCase().startsWith(queryLower)) {
        suggestions.add(component.name);
      }

      // Add advertiser names
      if (component.taxonomy?.advertiser?.toLowerCase().startsWith(queryLower)) {
        suggestions.add(component.taxonomy.advertiser);
      }

      // Add ad unit types
      if (component.taxonomy?.adUnitType?.toLowerCase().includes(queryLower)) {
        suggestions.add(component.taxonomy.adUnitType);
      }
    });

    return Array.from(suggestions).slice(0, 8);
  }

  getPopularSuggestions() {
    const popular = Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);

    // Fill with default suggestions if not enough popular searches
    const defaults = ['Toyota', 'Interactive', 'Auto', 'Sports', 'Showcase'];
    const suggestions = [...popular];
    
    for (const suggestion of defaults) {
      if (suggestions.length >= 8) break;
      if (!suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  recordSearch(query, filters) {
    const searchEntry = {
      query,
      filters,
      timestamp: Date.now(),
      url: window.location?.href
    };

    this.searchHistory.push(searchEntry);
    
    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }

    // Update popular searches
    if (query && query.trim()) {
      const queryTrimmed = query.trim();
      this.popularSearches.set(
        queryTrimmed, 
        (this.popularSearches.get(queryTrimmed) || 0) + 1
      );
    }
  }

  getSearchAnalytics() {
    const totalSearches = this.searchHistory.length;
    const uniqueQueries = new Set(this.searchHistory.map(s => s.query)).size;
    const averageQueryLength = this.searchHistory.reduce(
      (sum, search) => sum + (search.query?.length || 0), 0
    ) / totalSearches;

    const filterUsage = {};
    this.searchHistory.forEach(search => {
      Object.keys(search.filters || {}).forEach(filter => {
        filterUsage[filter] = (filterUsage[filter] || 0) + 1;
      });
    });

    return {
      totalSearches,
      uniqueQueries,
      averageQueryLength: Math.round(averageQueryLength * 100) / 100,
      filterUsage,
      popularSearches: Array.from(this.popularSearches.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      recentSearches: this.searchHistory.slice(-10)
    };
  }

  exportSearchData() {
    return {
      searchHistory: this.searchHistory,
      popularSearches: Array.from(this.popularSearches.entries()),
      analytics: this.getSearchAnalytics(),
      configuration: this.searchConfiguration,
      timestamp: Date.now()
    };
  }

  clearSearchHistory() {
    this.searchHistory = [];
    this.popularSearches.clear();
  }

  updateSearchConfiguration(newConfig) {
    this.searchConfiguration = { ...this.searchConfiguration, ...newConfig };
    // Rebuild index with new configuration
    this.buildSearchIndex();
  }
}

if (typeof window !== 'undefined') {
  window.ComponentSearchEngine = ComponentSearchEngine;
}

export default ComponentSearchEngine;