// Script to convert CGPA values from 4.0 scale to 10.0 scale
const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'testing/population-scripts/populateUniversitiesClient.js',
  'testing/population-scripts/populateUniversities.js',
  'testing/scripts/test-pdf-export.js'
];

// Convert CGPA from 4.0 to 10.0 scale
function convertCGPA(cgpa) {
  return parseFloat((cgpa * 2.5).toFixed(2));
}

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Processing ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Match cgpa_requirement patterns and convert them
    content = content.replace(/cgpa_requirement:\s*(\d+\.?\d*)/g, (match, cgpaValue) => {
      const oldCGPA = parseFloat(cgpaValue);
      // Only convert if it's in 4.0 scale (values <= 4.0)
      if (oldCGPA <= 4.0) {
        const newCGPA = convertCGPA(oldCGPA);
        console.log(`  Converting CGPA ${oldCGPA} -> ${newCGPA}`);
        return `cgpa_requirement: ${newCGPA}`;
      }
      return match;
    });
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Updated ${filePath}`);
  } else {
    console.log(`⚠ File not found: ${filePath}`);
  }
});

console.log('\nCGPA conversion complete!');
