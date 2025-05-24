import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { academicProfileService } from '../../services/universityService';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import Button from '../common/Button';
import Alert from '../common/Alert';

const AcademicProfileForm = ({ onSave }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    cgpa: '',
    ielts_score: '',
    toefl_score: '',
    gre_score: '',
    budget_min: '',
    budget_max: '',
    preferred_countries: [],
    preferred_fields_of_study: []
  });

  const countryOptions = [
    { value: 'USA', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'France', label: 'France' },
    { value: 'Ireland', label: 'Ireland' },
    { value: 'New Zealand', label: 'New Zealand' },
    { value: 'Singapore', label: 'Singapore' }
  ];

  const fieldOptions = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
    { value: 'Software Engineering', label: 'Software Engineering' },
    { value: 'Information Technology', label: 'Information Technology' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'Electrical Engineering', label: 'Electrical Engineering' },
    { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
    { value: 'Civil Engineering', label: 'Civil Engineering' },
    { value: 'Chemical Engineering', label: 'Chemical Engineering' },
    { value: 'Business Administration', label: 'Business Administration' },
    { value: 'Management', label: 'Management' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Economics', label: 'Economics' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Psychology', label: 'Psychology' },
    { value: 'Medicine', label: 'Medicine' },
    { value: 'Pharmacy', label: 'Pharmacy' },
    { value: 'Biology', label: 'Biology' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Mathematics', label: 'Mathematics' }
  ];

  useEffect(() => {
    loadAcademicProfile();
  }, [currentUser]);

  const loadAcademicProfile = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const profile = await academicProfileService.getAcademicProfile(currentUser.uid);
      if (profile) {
        setFormData({
          cgpa: profile.cgpa || '',
          ielts_score: profile.ielts_score || '',
          toefl_score: profile.toefl_score || '',
          gre_score: profile.gre_score || '',
          budget_min: profile.budget_min || '',
          budget_max: profile.budget_max || '',
          preferred_countries: profile.preferred_countries || [],
          preferred_fields_of_study: profile.preferred_fields_of_study || []
        });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load academic profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      const isSelected = currentValues.includes(value);
      
      return {
        ...prev,
        [name]: isSelected 
          ? currentValues.filter(item => item !== value)
          : [...currentValues, value]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;

    setSaving(true);
    setAlert(null);

    try {
      // Convert string numbers to actual numbers
      const profileData = {
        ...formData,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        ielts_score: formData.ielts_score ? parseFloat(formData.ielts_score) : null,
        toefl_score: formData.toefl_score ? parseInt(formData.toefl_score) : null,
        gre_score: formData.gre_score ? parseInt(formData.gre_score) : null,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null
      };

      await academicProfileService.updateAcademicProfile(currentUser.uid, profileData);
      setAlert({ type: 'success', message: 'Academic profile updated successfully!' });
      
      if (onSave) {
        onSave(profileData);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update academic profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-secondary-200 rounded-xl w-1/3"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-secondary-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          Academic Profile
        </h2>
        <p className="text-secondary-600 mt-2">
          Complete your academic profile to get personalized university recommendations
        </p>
      </div>

      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academic Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="CGPA (out of 4.0)"
            name="cgpa"
            type="number"
            step="0.01"
            min="0"
            max="4"
            value={formData.cgpa}
            onChange={handleChange}
            placeholder="e.g., 3.75"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <FormInput
            label="IELTS Score"
            name="ielts_score"
            type="number"
            step="0.5"
            min="0"
            max="9"
            value={formData.ielts_score}
            onChange={handleChange}
            placeholder="e.g., 7.5"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            }
          />

          <FormInput
            label="TOEFL Score"
            name="toefl_score"
            type="number"
            min="0"
            max="120"
            value={formData.toefl_score}
            onChange={handleChange}
            placeholder="e.g., 105"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            }
          />

          <FormInput
            label="GRE Score"
            name="gre_score"
            type="number"
            min="260"
            max="340"
            value={formData.gre_score}
            onChange={handleChange}
            placeholder="e.g., 320"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </div>

        {/* Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Minimum Budget (USD/year)"
            name="budget_min"
            type="number"
            min="0"
            value={formData.budget_min}
            onChange={handleChange}
            placeholder="e.g., 20000"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />

          <FormInput
            label="Maximum Budget (USD/year)"
            name="budget_max"
            type="number"
            min="0"
            value={formData.budget_max}
            onChange={handleChange}
            placeholder="e.g., 50000"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
        </div>

        {/* Preferred Countries */}
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-3 ml-1">
            Preferred Countries
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {countryOptions.map((country) => (
              <button
                key={country.value}
                type="button"
                onClick={() => handleMultiSelect('preferred_countries', country.value)}
                className={`p-3 rounded-xl border-2 transition-all duration-300 text-sm font-medium ${
                  formData.preferred_countries.includes(country.value)
                    ? 'border-primary-400 bg-primary-50 text-primary-700 shadow-primary-glow'
                    : 'border-secondary-200 bg-white/50 text-secondary-600 hover:border-secondary-300 hover:bg-white/80'
                }`}
              >
                {country.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Fields of Study */}
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-3 ml-1">
            Preferred Fields of Study
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fieldOptions.map((field) => (
              <button
                key={field.value}
                type="button"
                onClick={() => handleMultiSelect('preferred_fields_of_study', field.value)}
                className={`p-3 rounded-xl border-2 transition-all duration-300 text-sm font-medium text-left ${
                  formData.preferred_fields_of_study.includes(field.value)
                    ? 'border-accent-400 bg-accent-50 text-accent-700 shadow-accent-glow'
                    : 'border-secondary-200 bg-white/50 text-secondary-600 hover:border-secondary-300 hover:bg-white/80'
                }`}
              >
                {field.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <Button
            type="submit"
            variant="gradient"
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Profile...
              </>
            ) : (
              'Save Academic Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AcademicProfileForm;
