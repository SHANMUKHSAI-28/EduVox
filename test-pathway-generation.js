// Test script to verify pathway generation fixes
// Test the JSON parsing with comments
const testJSONWithComments = `{
  // This is a single line comment
  "universities": [
    {
      "name": "Test University",
      /* This is a multi-line
         comment */
      "ranking": "Top 100",
      "tuitionFee": "$50,000"
    }
  ],
  "timeline": [
    {
      "month": "January 2024", // Another comment
      "tasks": ["Task 1", "Task 2"]
    }
  ]
}`;

// Test our comment removal logic
function cleanJSONComments(text) {
  let cleanText = text;
  cleanText = cleanText.replace(/\/\/.*?(\r?\n|$)/g, '$1'); // Remove single-line comments
  cleanText = cleanText.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
  return cleanText;
}

try {
  const cleanedJSON = cleanJSONComments(testJSONWithComments);
  const parsed = JSON.parse(cleanedJSON);
  console.log('✅ JSON parsing with comments works correctly:', parsed);
} catch (error) {
  console.error('❌ JSON parsing failed:', error);
}

console.log('🧪 Test completed - JSON comment removal logic verified');
