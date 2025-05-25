// Currency Service for EduVox
// Handles currency conversion with Google Exchange Rates API and daily updates

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

class CurrencyService {
  constructor() {
    this.googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    this.baseApiUrl = 'https://api.exchangerate-api.com/v4/latest/'; // Free fallback API
    this.googleApiUrl = 'https://api.currencyapi.com/v3/latest'; // Premium Google-based API
    
    // Currency mapping for countries
    this.countryCurrencyMap = {
      'US': 'USD',
      'United States': 'USD',
      'UK': 'GBP', 
      'United Kingdom': 'GBP',
      'Canada': 'CAD',
      'Australia': 'AUD',
      'Germany': 'EUR',
      'France': 'EUR',
      'Netherlands': 'EUR',
      'Italy': 'EUR',
      'Spain': 'EUR',
      'Sweden': 'SEK',
      'Norway': 'NOK',
      'Denmark': 'DKK',
      'Switzerland': 'CHF',
      'Japan': 'JPY',
      'South Korea': 'KRW',
      'Singapore': 'SGD',
      'Hong Kong': 'HKD',
      'New Zealand': 'NZD',
      'India': 'INR'
    };

    // Currency symbols for display
    this.currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NZD': 'NZ$',
      'KRW': '₩'
    };

    // Initialize user preferences
    this.userCurrency = this.getUserCurrencyPreference();
  }

  /**
   * Get currency for a specific country
   */
  getCurrencyForCountry(country) {
    return this.countryCurrencyMap[country] || 'USD';
  }

  /**
   * Get currency symbol for display
   */
  getCurrencySymbol(currency) {
    return this.currencySymbols[currency] || currency;
  }

  /**
   * Get user's preferred currency from localStorage
   */
  getUserCurrencyPreference() {
    return localStorage.getItem('userCurrency') || 'INR';
  }

  /**
   * Set user's preferred currency
   */
  setUserCurrencyPreference(currency) {
    localStorage.setItem('userCurrency', currency);
    this.userCurrency = currency;
  }

  /**
   * Fetch latest exchange rates from Google-based API
   */
  async fetchExchangeRates() {
    try {
      console.log('🔄 Fetching latest exchange rates...');
      
      // Try Google-based currency API first
      if (this.googleApiKey) {
        try {
          const response = await fetch(`${this.googleApiUrl}?apikey=${this.googleApiKey}&base_currency=USD`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              console.log('✅ Successfully fetched rates from Google-based API');
              return {
                rates: data.data,
                timestamp: new Date().toISOString(),
                source: 'google-currency-api'
              };
            }
          }
        } catch (error) {
          console.warn('⚠️ Google-based API failed, trying fallback:', error.message);
        }
      }

      // Fallback to free exchange rate API
      const response = await fetch(`${this.baseApiUrl}USD`);
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Successfully fetched rates from fallback API');
      
      return {
        rates: data.rates,
        timestamp: new Date().toISOString(),
        source: 'exchangerate-api'
      };

    } catch (error) {
      console.error('❌ Failed to fetch exchange rates:', error);
      
      // Return default rates as fallback
      return {
        rates: this.getDefaultRates(),
        timestamp: new Date().toISOString(),
        source: 'default-fallback'
      };
    }
  }

  /**
   * Get default exchange rates as fallback
   */
  getDefaultRates() {
    return {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110,
      INR: 83.12,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      SEK: 8.9,
      NOK: 8.7,
      DKK: 6.3,
      SGD: 1.35,
      HKD: 7.8,
      NZD: 1.45,
      KRW: 1200
    };
  }

  /**
   * Store exchange rates in Firebase
   */
  async storeExchangeRates(ratesData) {
    try {
      const exchangeRatesRef = doc(db, 'system', 'exchangeRates');
      await setDoc(exchangeRatesRef, {
        ...ratesData,
        updatedAt: serverTimestamp(),
        lastUpdate: new Date().toISOString()
      });
      console.log('✅ Exchange rates stored in Firebase');
    } catch (error) {
      console.error('❌ Failed to store exchange rates:', error);
    }
  }

  /**
   * Get stored exchange rates from Firebase
   */
  async getStoredExchangeRates() {
    try {
      const exchangeRatesRef = doc(db, 'system', 'exchangeRates');
      const docSnap = await getDoc(exchangeRatesRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastUpdate = new Date(data.lastUpdate);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
        
        // Return cached rates if updated within last 24 hours
        if (hoursSinceUpdate < 24) {
          console.log('✅ Using cached exchange rates');
          return data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get stored exchange rates:', error);
      return null;
    }
  }

  /**
   * Get current exchange rates (cached or fresh)
   */
  async getCurrentExchangeRates() {
    // Try to get cached rates first
    let ratesData = await this.getStoredExchangeRates();
    
    if (!ratesData) {
      // Fetch fresh rates if no cache or cache expired
      ratesData = await this.fetchExchangeRates();
      await this.storeExchangeRates(ratesData);
    }
    
    return ratesData;
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      const ratesData = await this.getCurrentExchangeRates();
      const rates = ratesData.rates;

      // Convert through USD if necessary
      let usdAmount = amount;
      if (fromCurrency !== 'USD') {
        usdAmount = amount / rates[fromCurrency];
      }

      // Convert from USD to target currency
      const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * rates[toCurrency];
      
      return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('❌ Currency conversion failed:', error);
      return amount; // Return original amount if conversion fails
    }
  }

  /**
   * Format currency amount with proper symbol and formatting
   */
  formatCurrency(amount, currency = 'USD', options = {}) {
    const {
      showSymbol = true,
      showCode = false,
      maximumFractionDigits = 0,
      minimumFractionDigits = 0
    } = options;

    if (!amount && amount !== 0) return 'N/A';

    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency,
        maximumFractionDigits,
        minimumFractionDigits
      });

      let formatted = formatter.format(amount);
      
      if (showCode && !showSymbol) {
        formatted += ` ${currency}`;
      }

      return formatted;
    } catch (error) {
      console.error('❌ Currency formatting failed:', error);
      return `${this.getCurrencySymbol(currency)}${amount.toLocaleString()}`;
    }
  }

  /**
   * Format currency range (min - max)
   */
  formatCurrencyRange(min, max, currency = 'USD', options = {}) {
    if (!min && !max) return 'Not specified';
    
    if (min === max) {
      return this.formatCurrency(min, currency, options);
    }
    
    return `${this.formatCurrency(min, currency, options)} - ${this.formatCurrency(max, currency, options)}`;
  }

  /**
   * Convert and format tuition costs with dual currency display
   */
  async formatTuitionWithConversion(tuitionMin, tuitionMax, originalCurrency, showOriginal = true) {
    const userCurrency = this.getUserCurrencyPreference();
    
    if (originalCurrency === userCurrency || !showOriginal) {
      return this.formatCurrencyRange(tuitionMin, tuitionMax, originalCurrency);
    }

    try {
      const convertedMin = await this.convertCurrency(tuitionMin, originalCurrency, userCurrency);
      const convertedMax = await this.convertCurrency(tuitionMax, originalCurrency, userCurrency);
      
      const originalFormat = this.formatCurrencyRange(tuitionMin, tuitionMax, originalCurrency);
      const convertedFormat = this.formatCurrencyRange(convertedMin, convertedMax, userCurrency);
      
      return `${convertedFormat} (${originalFormat})`;
    } catch (error) {
      console.error('❌ Tuition conversion failed:', error);
      return this.formatCurrencyRange(tuitionMin, tuitionMax, originalCurrency);
    }
  }

  /**
   * Daily update job for exchange rates
   */
  async dailyExchangeRateUpdate() {
    try {
      console.log('🔄 Running daily exchange rate update...');
      const ratesData = await this.fetchExchangeRates();
      await this.storeExchangeRates(ratesData);
      console.log('✅ Daily exchange rate update completed');
      return true;
    } catch (error) {
      console.error('❌ Daily exchange rate update failed:', error);
      return false;
    }
  }

  /**
   * Initialize currency service and setup daily updates
   */
  async initialize() {
    console.log('🚀 Initializing Currency Service...');
    
    // Ensure we have current exchange rates
    await this.getCurrentExchangeRates();
    
    // Setup daily update interval (run every 24 hours)
    setInterval(() => {
      this.dailyExchangeRateUpdate();
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    console.log('✅ Currency Service initialized');
  }

  /**
   * Get supported currencies list
   */
  getSupportedCurrencies() {
    return Object.keys(this.currencySymbols).map(code => ({
      code,
      symbol: this.currencySymbols[code],
      name: this.getCurrencyName(code)
    }));
  }

  /**
   * Get human-readable currency name
   */
  getCurrencyName(code) {
    const names = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'JPY': 'Japanese Yen',
      'INR': 'Indian Rupee',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'CHF': 'Swiss Franc',
      'SEK': 'Swedish Krona',
      'NOK': 'Norwegian Krone',
      'DKK': 'Danish Krone',
      'SGD': 'Singapore Dollar',
      'HKD': 'Hong Kong Dollar',
      'NZD': 'New Zealand Dollar',
      'KRW': 'South Korean Won'
    };
    return names[code] || code;
  }
}

// Create and export singleton instance
const currencyService = new CurrencyService();
export default currencyService;
