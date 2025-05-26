// AI Recommendation Service for detailed pathway analysis
class AIRecommendationService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  /**
   * Get detailed pathway analysis from Gemini AI
   * @param {string} prompt - Comprehensive prompt for AI analysis
   * @returns {Object} - Detailed pathway analysis
   */
  async getDetailedPathwayAnalysis(prompt) {
    try {
      console.log('🤖 Sending request to Gemini AI for detailed analysis');
      
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini AI');
      }

      const aiText = data.candidates[0].content.parts[0].text;
      console.log('📄 Raw AI response received, parsing JSON...');      // Try to extract JSON from the response
      let pathwayData;
      try {
        // Look for JSON in the response (might be wrapped in markdown code blocks)
        const jsonMatch = aiText.match(/```json\n?([\s\S]*?)\n?```/) || 
                         aiText.match(/\{[\s\S]*\}/);
        
        let jsonContent = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText;
        
        // Remove comments in JSON (both single-line // comments and multi-line /* */ comments)
        jsonContent = jsonContent.replace(/\/\/.*?(\r?\n|$)/g, '$1'); // Remove single-line comments
        jsonContent = jsonContent.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
        
        pathwayData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        // Fallback: create a structured response from the text
        pathwayData = this.createFallbackStructure(aiText);
      }

      // Ensure required fields are present
      pathwayData = this.validateAndEnhancePathway(pathwayData);

      console.log('✅ Detailed pathway analysis completed successfully');
      return {
        success: true,
        pathway: pathwayData
      };

    } catch (error) {
      console.error('Error in getDetailedPathwayAnalysis:', error);
      return {
        success: false,
        error: error.message,
        pathway: this.createBasicFallbackPathway()
      };
    }
  }

  /**
   * Create a fallback structure when JSON parsing fails
   * @param {string} text - Raw AI response text
   * @returns {Object} - Basic structured pathway
   */
  createFallbackStructure(text) {
    return {
      id: 'ai_detailed_analysis',
      country: 'Target Country',
      course: 'Selected Field of Study',
      academicLevel: 'Graduate/Undergraduate',
      timeline: {
        totalDuration: '18-24 months',
        phases: [
          { phase: 'Preparation', duration: '6 months', description: 'Initial preparation and documentation' },
          { phase: 'Application', duration: '6 months', description: 'University applications and visa process' },
          { phase: 'Departure', duration: '3 months', description: 'Final preparations and travel arrangements' }
        ]
      },
      universities: [],
      costs: {
        tuition: 'As per AI analysis',
        living: 'As per AI analysis',
        total: 'Contact admissions for exact figures'
      },
      visa: {
        type: 'Student Visa',
        requirements: ['Passport', 'Acceptance Letter', 'Financial Proof'],
        timeline: '4-8 weeks'
      },
      steps: [
        {
          step: 1,
          title: 'Document Preparation',
          description: text.substring(0, 200) + '...',
          duration: '2-4 weeks',
          status: 'pending',
          tasks: ['Gather required documents', 'Get translations if needed']
        }
      ],
      scholarships: [],
      tips: ['Based on AI analysis: ' + text.substring(0, 300) + '...'],
      alternatives: [],
      aiAnalysis: text // Store the full AI response
    };
  }

  /**
   * Validate and enhance pathway data
   * @param {Object} pathway - Raw pathway data
   * @returns {Object} - Enhanced pathway data
   */
  validateAndEnhancePathway(pathway) {
    // Ensure required fields exist
    pathway.id = pathway.id || 'detailed_ai_analysis';
    pathway.country = pathway.country || 'Target Country';
    pathway.course = pathway.course || 'Selected Field';
    pathway.academicLevel = pathway.academicLevel || 'Graduate';
    
    // Ensure timeline exists
    if (!pathway.timeline) {
      pathway.timeline = {
        totalDuration: '18-24 months',
        phases: []
      };
    }

    // Ensure steps have required status field
    if (pathway.steps) {
      pathway.steps = pathway.steps.map((step, index) => ({
        ...step,
        step: step.step || index + 1,
        status: step.status || 'pending',
        priority: step.priority || 'medium'
      }));
    }

    // Add metadata
    pathway.generatedAt = new Date().toISOString();
    pathway.source = 'gemini_ai_detailed_analysis';
    pathway.isDetailed = true;

    return pathway;
  }

  /**
   * Create a basic fallback pathway when everything fails
   * @returns {Object} - Basic pathway structure
   */
  createBasicFallbackPathway() {
    return {
      id: 'basic_detailed_fallback',
      country: 'Selected Country',
      course: 'Selected Field of Study',
      academicLevel: 'Graduate',
      timeline: {
        totalDuration: '18 months',
        phases: [
          { phase: 'Preparation', duration: '6 months' },
          { phase: 'Application', duration: '6 months' },
          { phase: 'Finalization', duration: '6 months' }
        ]
      },
      universities: [],
      costs: {
        tuition: 'Contact universities for exact fees',
        living: 'Varies by city and lifestyle',
        total: 'Budget $50,000-$100,000 depending on country'
      },
      visa: {
        type: 'Student Visa',
        requirements: ['Valid passport', 'University acceptance', 'Financial proof'],
        timeline: '4-8 weeks processing time'
      },
      steps: [
        {
          step: 1,
          title: 'Complete University Applications',
          description: 'Apply to selected universities with all required documents',
          duration: '2-3 months',
          status: 'pending',
          tasks: ['Prepare SOP', 'Get recommendation letters', 'Submit applications']
        },
        {
          step: 2,
          title: 'Visa Application Process',
          description: 'Apply for student visa after receiving acceptance',
          duration: '1-2 months',
          status: 'pending',
          tasks: ['Gather visa documents', 'Schedule visa interview', 'Pay visa fees']
        }
      ],
      scholarships: [],
      tips: [
        'Start your preparation early',
        'Keep all documents organized',
        'Research scholarship opportunities',
        'Connect with current students for insights'
      ],
      alternatives: [],
      fallback: true,
      generatedAt: new Date().toISOString()
    };
  }
}

export default new AIRecommendationService();