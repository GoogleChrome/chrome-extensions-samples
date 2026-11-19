// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Region configurations for Google Search.
 *
 * Historically, Google Search results were localized by domain (e.g., google.com.br).
 * However, modern Google Search uses IP geolocation for most localization.
 *
 * To simulate region-specific searches, we now use query parameters:
 * - cr (country restriction): Restricts results to a specific country
 * - lr (language restriction): Restricts results to a specific language
 *
 * This demonstrates how to customize Google Search programmatically while
 * reflecting modern Google behavior.
 *
 * @type {Object.<string, {country: string, language: string, display: string}>}
 */
export const regions = {
  'au': {
    country: 'countryAU',
    language: 'lang_en',
    display: 'Australia'
  },
  'br': {
    country: 'countryBR',
    language: 'lang_pt',
    display: 'Brazil'
  },
  'ca': {
    country: 'countryCA',
    language: 'lang_en',
    display: 'Canada'
  },
  'cn': {
    country: 'countryCN',
    language: 'lang_zh-CN',
    display: 'China'
  },
  'fr': {
    country: 'countryFR',
    language: 'lang_fr',
    display: 'France'
  },
  'it': {
    country: 'countryIT',
    language: 'lang_it',
    display: 'Italy'
  },
  'in': {
    country: 'countryIN',
    language: 'lang_en',
    display: 'India'
  },
  'jp': {
    country: 'countryJP',
    language: 'lang_ja',
    display: 'Japan'
  },
  'mx': {
    country: 'countryMX',
    language: 'lang_es',
    display: 'Mexico'
  },
  'ru': {
    country: 'countryRU',
    language: 'lang_ru',
    display: 'Russia'
  },
  'za': {
    country: 'countryZA',
    language: 'lang_en',
    display: 'South Africa'
  },
  'uk': {
    country: 'countryGB',
    language: 'lang_en',
    display: 'United Kingdom'
  }
};
