import React from 'react';
import { X, ExternalLink, MapPin, DollarSign, Trophy, Users, Download } from 'lucide-react';
import { University } from '../../../types/university';
import { Button } from '../../../components/common/Button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UniversityComparisonProps {
  universities: University[];
  onClose: () => void;
  onRemove: (university: University) => void;
}

export const UniversityComparison: React.FC<UniversityComparisonProps> = ({
  universities,
  onClose,
  onRemove,
}) => {
  const exportToPDF = async () => {
    const element = document.getElementById('comparison-table');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('university-comparison.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const formatTuition = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Contact for fees';
    if (!max) return `$${min?.toLocaleString()}+`;
    if (!min) return `Up to $${max?.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const getRequirementDisplay = (value: number | null, suffix: string = '') => {
    return value ? `${value}${suffix}` : 'Not specified';
  };

  if (universities.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No universities to compare</h3>
        <p className="text-gray-500">Select universities from the list to compare them side by side.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[80vh] overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Comparing {universities.length} {universities.length === 1 ? 'University' : 'Universities'}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div id="comparison-table" className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-4 text-left font-medium text-gray-900 w-48">
                  Criteria
                </th>
                {universities.map((university) => (
                  <th key={university.id} className="border border-gray-300 p-4 text-center min-w-[250px]">
                    <div className="relative">
                      <button
                        onClick={() => onRemove(university)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Remove from comparison"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-2">{university.name}</h4>
                        <div className="flex items-center justify-center text-gray-600 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="text-xs">{university.country}</span>
                        </div>
                      </div>
                      {university.website && (
                        <a
                          href={university.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Location */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                    Location
                  </div>
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    <div>{university.city}, {university.state}</div>
                    <div className="text-sm text-gray-600">{university.country}</div>
                  </td>
                ))}
              </tr>

              {/* University Type */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-600" />
                    Type
                  </div>
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      university.type === 'public' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {university.type === 'public' ? 'Public' : 'Private'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Ranking */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-gray-600" />
                    World Ranking
                  </div>
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    {university.ranking ? (
                      <span className="font-medium text-primary-600">#{university.ranking}</span>
                    ) : (
                      <span className="text-gray-500">Not ranked</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Tuition */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
                    Annual Tuition
                  </div>
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    <div className="font-medium text-green-600">
                      {formatTuition(university.tuition_min, university.tuition_max)}
                    </div>
                  </td>
                ))}
              </tr>

              {/* CGPA Requirement */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  CGPA Requirement
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    {getRequirementDisplay(university.cgpa_requirement, '/4.0')}
                  </td>
                ))}
              </tr>

              {/* IELTS Requirement */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  IELTS Requirement
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    {getRequirementDisplay(university.ielts_requirement, '/9.0')}
                  </td>
                ))}
              </tr>

              {/* TOEFL Requirement */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  TOEFL Requirement
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    {getRequirementDisplay(university.toefl_requirement, '/120')}
                  </td>
                ))}
              </tr>

              {/* GRE Requirement */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  GRE Requirement
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    {getRequirementDisplay(university.gre_requirement, '/340')}
                  </td>
                ))}
              </tr>

              {/* Application Deadline */}
              <tr>
                <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                  Application Deadline
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="border border-gray-300 p-4 text-center">
                    {university.application_deadline 
                      ? new Date(university.application_deadline).toLocaleDateString()
                      : 'Contact university'
                    }
                  </td>
                ))}
              </tr>

              {/* Match Score */}
              {universities.some(u => u.match_score) && (
                <tr>
                  <td className="border border-gray-300 p-4 font-medium bg-gray-50">
                    Match Score
                  </td>
                  {universities.map((university) => (
                    <td key={university.id} className="border border-gray-300 p-4 text-center">
                      {university.match_score ? (
                        <div className="flex items-center justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${university.match_score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-primary-600">
                            {Math.round(university.match_score)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => {
            // You can add logic here to navigate to application page with selected universities
            console.log('Apply to selected universities:', universities);
          }}
        >
          Apply to Selected
        </Button>
      </div>
    </div>
  );
};
