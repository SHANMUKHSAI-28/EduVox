// Currency Toggle Component
// Allows users to switch between INR and local currency display

import React, { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { FaGlobe, FaRupeeSign, FaDollarSign, FaEuroSign, FaPoundSign } from 'react-icons/fa';
import currencyService from '../../services/currencyService';

const CurrencyToggle = ({ className = '', size = 'sm' }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize with user's saved preference
    const savedCurrency = currencyService.getUserCurrencyPreference();
    setSelectedCurrency(savedCurrency);
  }, []);

  const supportedCurrencies = [
    { code: 'INR', name: 'Indian Rupee', icon: FaRupeeSign, flag: '🇮🇳' },
    { code: 'USD', name: 'US Dollar', icon: FaDollarSign, flag: '🇺🇸' },
    { code: 'GBP', name: 'British Pound', icon: FaPoundSign, flag: '🇬🇧' },
    { code: 'EUR', name: 'Euro', icon: FaEuroSign, flag: '🇪🇺' },
    { code: 'CAD', name: 'Canadian Dollar', icon: FaDollarSign, flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', icon: FaDollarSign, flag: '🇦🇺' }
  ];

  const handleCurrencyChange = async (currencyCode) => {
    setIsLoading(true);
    try {
      // Update user preference
      currencyService.setUserCurrencyPreference(currencyCode);
      setSelectedCurrency(currencyCode);
      
      // Trigger a page refresh to update all currency displays
      // In a real app, you might use a context or state management
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currency: currencyCode } 
      }));
      
    } catch (error) {
      console.error('Failed to change currency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCurrencyData = supportedCurrencies.find(c => c.code === selectedCurrency);
  const IconComponent = selectedCurrencyData?.icon || FaGlobe;

  return (
    <Dropdown className={className}>
      <Dropdown.Toggle
        variant="outline-secondary"
        size={size}
        className="d-flex align-items-center gap-2 border-0 bg-transparent"
        disabled={isLoading}
      >
        <span className="d-flex align-items-center gap-1">
          {selectedCurrencyData?.flag && (
            <span className="fs-6">{selectedCurrencyData.flag}</span>
          )}
          <IconComponent className="text-primary" />
          <span className="fw-medium">{selectedCurrency}</span>
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="border-0 shadow-lg">
        <Dropdown.Header className="text-muted small">
          <FaGlobe className="me-1" />
          Display Currency
        </Dropdown.Header>
        <Dropdown.Divider />
        
        {supportedCurrencies.map((currency) => {
          const CurrencyIcon = currency.icon;
          const isActive = currency.code === selectedCurrency;
          
          return (
            <Dropdown.Item
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`d-flex align-items-center gap-2 py-2 ${isActive ? 'bg-primary text-white' : ''}`}
              disabled={isLoading}
            >
              <span className="fs-6">{currency.flag}</span>
              <CurrencyIcon className={isActive ? 'text-white' : 'text-primary'} />
              <div className="d-flex flex-column">
                <span className="fw-medium">{currency.code}</span>
                <small className={`${isActive ? 'text-white-50' : 'text-muted'}`}>
                  {currency.name}
                </small>
              </div>
              {isActive && (
                <div className="ms-auto">
                  <i className="fas fa-check text-white"></i>
                </div>
              )}
            </Dropdown.Item>
          );
        })}
        
        <Dropdown.Divider />
        <Dropdown.Header className="text-muted small">
          <i className="fas fa-info-circle me-1"></i>
          Rates updated daily
        </Dropdown.Header>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CurrencyToggle;
