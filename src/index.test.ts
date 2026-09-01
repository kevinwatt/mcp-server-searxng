import { jest } from '@jest/globals';
import type { Response } from 'node-fetch';
import nock from 'nock';

import { 
  formatSearchResult, 
  isWebSearchArgs, 
  searchWithFallback,
  SEARXNG_INSTANCES
} from './index.js';

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
      nock.cleanAll();
      SEARXNG_INSTANCES.length = 0;
      SEARXNG_INSTANCES.push('https://instance1', 'https://instance2');
    });

    it('should try multiple instances on failure', async () => {
      // 第一個實例返回 500
      nock('https://instance1')
        .post('/search')
        .reply(500);

      // 第二個實例返回成功結果
      nock('https://instance2')
        .post('/search')
        .reply(200, {
          results: [{
            title: 'Test',
            url: 'https://test.com',
            content: 'Test content',
            engine: 'test-engine'
          }]
        });

      const result = await searchWithFallback({
        query: 'test'
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(1);
    });

    it('should return an empty result set (not throw) when a reachable instance has no results', async () => {
      // A 200 response with no results is a valid empty search, NOT an outage —
      // it must not be reported as "All SearXNG instances failed".
      nock('https://instance1')
        .post('/search')
        .reply(200, { results: [] });

      nock('https://instance2')
        .post('/search')
        .reply(200, { results: [] });

      const result = await searchWithFallback({
        query: 'test'
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(0);
    });

    it('should treat a 200 without a results array as a failed instance', async () => {
      // An auth portal or proxy error envelope answers 200 with JSON that is not
      // a search response. That instance is unusable, so it must not be counted
      // as "reached but empty" and reported as a successful empty search.
      nock('https://instance1')
        .post('/search')
        .reply(200, { error: 'auth required' });

      nock('https://instance2')
        .post('/search')
        .reply(200, { error: 'auth required' });

      await expect(searchWithFallback({
        query: 'test'
      })).rejects.toThrow('All SearXNG instances failed');
    });

    it('should still throw when every instance is unreachable', async () => {
      // No instance responded successfully → a genuine outage, still surfaced as
      // an error so it is distinguishable from an empty result.
      nock('https://instance1')
        .post('/search')
        .reply(500);

      nock('https://instance2')
        .post('/search')
        .replyWithError('connection refused');

      await expect(searchWithFallback({
        query: 'test'
      })).rejects.toThrow('All SearXNG instances failed');
    });

    it('should resolve urls correctly', async() => {
      SEARXNG_INSTANCES.splice(0, SEARXNG_INSTANCES.length);
      SEARXNG_INSTANCES.push('https://instance1/relative/')

      nock('https://instance1')
        .post('/relative/search')
        .reply(200, { results: [{
            title: 'Test',
            url: 'https://test.com',
            content: 'Test content',
            engine: 'test-engine'
          }]
        });

      const result = await searchWithFallback({
        query: 'test'
      });
      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(1);
    });

    it('should resolve urls when base path has no trailing slash', async() => {
      SEARXNG_INSTANCES.splice(0, SEARXNG_INSTANCES.length);
      SEARXNG_INSTANCES.push('https://instance1/relative')

      nock('https://instance1')
        .post('/relative/search')
        .reply(200, { results: [{
            title: 'Test',
            url: 'https://test.com',
            content: 'Test content',
            engine: 'test-engine'
          }]
        });

      const result = await searchWithFallback({
        query: 'test'
      });
      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(1);
    });
  });
}); 
