import { jest } from '@jest/globals';
import { 
  formatSearchResult, 
  isWebSearchArgs, 
  searchWithFallback,
  SEARXNG_INSTANCES
} from './index';

describe('SearXNG MCP Server', () => {
  describe('formatSearchResult', () => {
    it('should format complete search result', () => {
      const result = {
        title: 'Test Title',
        url: 'https://example.com',
        content: 'Test content',
        engine: 'google'
      };
      
      expect(formatSearchResult(result)).toBe(
        'Title: Test Title\n' +
        'URL: https://example.com\n' +
        'Content: Test content\n' +
        'Source: google'
      );
    });

    it('should handle missing optional fields', () => {
      const result = {
        title: 'Test Title',
        url: 'https://example.com'
      };
      
      expect(formatSearchResult(result)).toBe(
        'Title: Test Title\n' +
        'URL: https://example.com'
      );
    });
  });

  describe('isWebSearchArgs', () => {
    it('should validate correct search args', () => {
      const args = {
        query: 'test query',
        page: 1,
        language: 'en'
      };
      
      expect(isWebSearchArgs(args)).toBe(true);
    });

    it('should reject invalid args', () => {
      expect(isWebSearchArgs(null)).toBe(false);
      expect(isWebSearchArgs({})).toBe(false);
      expect(isWebSearchArgs({ query: 123 })).toBe(false);
    });
  });

  describe('searchWithFallback', () => {
    beforeEach(() => {
      // Setup fetch mock with correct type
      global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
      // Override SEARXNG_INSTANCES to include two instances for fallback
      SEARXNG_INSTANCES.length = 0;
      SEARXNG_INSTANCES.push('http://instance1', 'http://instance2');
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should try multiple instances on failure', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // Mock first call to fail
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('First instance failed')));
      
      // Mock second call to succeed
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            results: [{
              title: 'Test',
              url: 'https://test.com',
              content: 'Test content',
              engine: 'test-engine'
            }]
          })
        } as Response)
      );

      const result = await searchWithFallback({
        query: 'test'
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle no results', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ results: [] })
        } as Response)
      );

      await expect(searchWithFallback({
        query: 'test'
      })).rejects.toThrow('All SearXNG instances failed');
    });
  });
}); 