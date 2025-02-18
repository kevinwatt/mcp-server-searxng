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

    it('should handle no results', async () => {
      // 改用 nock 來模擬 no results 的情況
      nock('https://instance1')
        .post('/search')
        .reply(200, { results: [] });

      nock('https://instance2')
        .post('/search')
        .reply(200, { results: [] });

      await expect(searchWithFallback({
        query: 'test'
      })).rejects.toThrow('All SearXNG instances failed');
    });
  });
}); 