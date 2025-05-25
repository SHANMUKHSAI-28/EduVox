import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import pathwayScrapingService from '../../services/pathwayScrapingService';

const PathwayScrapingAdmin = () => {
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(null);
  const [scrapingStats, setScrapingStats] = useState(null);
  const [scrapingResults, setScrapingResults] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadScrapingStats();
  }, []);

  const loadScrapingStats = async () => {
    try {
      const stats = await pathwayScrapingService.getScrapingStats();
      setScrapingStats(stats);
    } catch (error) {
      console.error('Failed to load scraping stats:', error);
    }
  };

  const handleStartScraping = async () => {
    if (!window.confirm(
      `This will generate pathways for thousands of combinations using the Gemini AI API. ` +
      `This process may take several hours and will consume API credits. ` +
      `Are you sure you want to continue?`
    )) {
      return;
    }

    setIsScrapingActive(true);
    setScrapingProgress({ completed: 0, total: 0, status: 'starting' });
    setAlert(null);
    setScrapingResults(null);    try {
      const results = await pathwayScrapingService.scrapeAllPathways((progress) => {
        setScrapingProgress(progress);
      });

      setScrapingResults(results);
      setAlert({
        type: 'success',
        message: `Scraping completed! ${results.successful.length} pathways generated successfully.`
      });

      // Reload stats
      await loadScrapingStats();

    } catch (error) {
      console.error('Scraping failed:', error);
      setAlert({
        type: 'error',
        message: `Scraping failed: ${error.message}`
      });
    } finally {
      setIsScrapingActive(false);
      setScrapingProgress(null);
    }
  };

  const handleStopScraping = () => {
    if (window.confirm('Are you sure you want to stop the scraping process?')) {
      setIsScrapingActive(false);
      setScrapingProgress(null);
      setAlert({
        type: 'warning',
        message: 'Scraping process stopped by user.'
      });
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const getProgressPercentage = () => {
    if (!scrapingProgress || !scrapingProgress.total) return 0;
    return Math.round((scrapingProgress.completed / scrapingProgress.total) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pathway Scraping Management</h2>
        <div className="flex space-x-4">
          <Button
            onClick={loadScrapingStats}
            variant="secondary"
            disabled={isScrapingActive}
          >
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Alert Messages */}
      {alert && (
        <div className={`p-4 rounded-md ${
          alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          alert.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}>
          <p>{alert.message}</p>
        </div>
      )}

      {/* Scraping Stats */}
      {scrapingStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Current Database Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(scrapingStats.totalPathways)}
              </div>
              <div className="text-sm text-gray-600">Total Pathways</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {scrapingStats.uniqueCountries}
              </div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {scrapingStats.uniqueCourses}
              </div>
              <div className="text-sm text-gray-600">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {scrapingStats.uniqueAcademicLevels}
              </div>
              <div className="text-sm text-gray-600">Academic Levels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {scrapingStats.uniqueNationalities}
              </div>
              <div className="text-sm text-gray-600">Nationalities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatNumber(scrapingStats.estimatedTotal)}
              </div>
              <div className="text-sm text-gray-600">Estimated Total</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">
              <strong>Coverage:</strong> {scrapingStats.totalPathways > 0 ? 
                ((scrapingStats.totalPathways / scrapingStats.estimatedTotal) * 100).toFixed(2) : 0}%
              of all possible combinations
            </div>
          </div>
        </div>
      )}

      {/* Scraping Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Pathway Generation</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">🤖 AI-Powered Pathway Generation</h4>
            <p className="text-sm text-blue-700">
              This feature uses Google's Gemini AI to generate comprehensive study abroad pathways 
              for all possible combinations of countries, courses, academic levels, budget ranges, 
              and nationalities. The generated pathways include university recommendations, 
              application timelines, visa requirements, and more.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This process may take several hours to complete</li>
              <li>• It will generate thousands of AI requests to the Gemini API</li>
              <li>• Make sure you have sufficient API credits</li>
              <li>• The process includes automatic rate limiting (2 seconds between requests)</li>
              <li>• Existing pathways will be skipped to avoid duplicates</li>
            </ul>
          </div>

          {!isScrapingActive ? (
            <Button
              onClick={handleStartScraping}
              className="bg-green-600 hover:bg-green-700"
              disabled={isScrapingActive}
            >
              🚀 Start Pathway Scraping
            </Button>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleStopScraping}
                className="bg-red-600 hover:bg-red-700"
              >
                ⏹️ Stop Scraping
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scraping Progress */}
      {scrapingProgress && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Scraping Progress</h3>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {scrapingProgress.completed} / {scrapingProgress.total}</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-lg font-semibold text-green-600">
                  {scrapingProgress.successful || 0}
                </div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-md">
                <div className="text-lg font-semibold text-red-600">
                  {scrapingProgress.failed || 0}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-semibold text-gray-600">
                  {scrapingProgress.completed - (scrapingProgress.successful || 0) - (scrapingProgress.failed || 0)}
                </div>
                <div className="text-sm text-gray-700">Skipped</div>
              </div>
            </div>

            {/* Current Item */}
            {scrapingProgress.current && (
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm">
                  <strong>Currently processing:</strong> {scrapingProgress.current}
                </div>
                <div className="flex items-center mt-2">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600">
                    Generating with Gemini AI...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scraping Results */}
      {scrapingResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Scraping Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-md">
              <div className="text-2xl font-bold text-green-600">
                {scrapingResults.successful.length}
              </div>
              <div className="text-sm text-green-700">Successfully Generated</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-md">
              <div className="text-2xl font-bold text-red-600">
                {scrapingResults.failed.length}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-md">
              <div className="text-2xl font-bold text-gray-600">
                {scrapingResults.skipped.length}
              </div>
              <div className="text-sm text-gray-700">Skipped (Already Exist)</div>
            </div>
          </div>

          {/* Failed Items Details */}
          {scrapingResults.failed.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-800 mb-2">Failed Items:</h4>
              <div className="bg-red-50 rounded-md p-3 max-h-40 overflow-y-auto">
                {scrapingResults.failed.slice(0, 10).map((item, index) => (
                  <div key={index} className="text-sm text-red-700 mb-1">
                    {item.id}: {item.error}
                  </div>
                ))}
                {scrapingResults.failed.length > 10 && (
                  <div className="text-sm text-red-600 font-medium">
                    ... and {scrapingResults.failed.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PathwayScrapingAdmin;
