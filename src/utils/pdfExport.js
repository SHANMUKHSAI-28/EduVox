import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export saved universities as PDF
 * @param {Array} universities - Array of university objects to export
 * @param {Object} userProfile - User's academic profile
 * @param {string} userEmail - User's email
 */
export const exportUniversitiesPDF = (universities, userProfile = null, userEmail = '') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Blue-500
  doc.text('UniGuidePro - University Shortlist', margin, 25);
  
  // Date and user info
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray-500
  const date = new Date().toLocaleDateString();
  doc.text(`Generated on: ${date}`, margin, 35);
  
  if (userEmail) {
    doc.text(`Student: ${userEmail}`, margin, 42);
  }
  
  let yPosition = 55;
  
  // Academic Profile Summary
  if (userProfile) {
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text('Academic Profile Summary', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // Gray-600
    
    const profileData = [
      ['CGPA', userProfile.cgpa ? `${userProfile.cgpa}/10` : 'Not specified'],
      ['IELTS Score', userProfile.ieltsScore ? `${userProfile.ieltsScore}/9` : 'Not taken'],
      ['TOEFL Score', userProfile.toeflScore ? `${userProfile.toeflScore}/120` : 'Not taken'],
      ['GRE Score', userProfile.greScore ? `${userProfile.greScore}/340` : 'Not taken'],
      ['Budget Range', userProfile.budgetRange ? `$${userProfile.budgetRange.min?.toLocaleString()} - $${userProfile.budgetRange.max?.toLocaleString()}` : 'Not specified'],
      ['Preferred Countries', userProfile.preferredCountries?.join(', ') || 'Not specified'],
      ['Fields of Study', userProfile.fieldsOfStudy?.join(', ') || 'Not specified']
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Criteria', 'Value']],
      body: profileData,
      theme: 'plain',
      headStyles: { fillColor: [239, 246, 255], textColor: [59, 130, 246], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
      margin: { left: margin, right: margin }
    });
    
    yPosition = doc.lastAutoTable.finalY + 20;
  }
  
  // Universities List
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text(`Shortlisted Universities (${universities.length})`, margin, yPosition);
  yPosition += 15;
  
  // Prepare university data for table
  const universityData = universities.map((uni, index) => {
    const matchScore = uni.matchScore ? `${Math.round(uni.matchScore)}%` : 'N/A';
    const category = uni.category || 'Target';
    const tuitionRange = uni.tuitionRange 
      ? `$${uni.tuitionRange.min?.toLocaleString()} - $${uni.tuitionRange.max?.toLocaleString()}`
      : 'Not specified';
    
    return [
      index + 1,
      uni.name || 'Unknown',
      `${uni.location?.city || ''}, ${uni.location?.country || ''}`.replace(/^, |, $/, ''),
      uni.type || 'University',
      uni.ranking?.world ? `#${uni.ranking.world}` : 'Unranked',
      matchScore,
      category,
      tuitionRange
    ];
  });
  
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 25;
  }
  
  doc.autoTable({
    startY: yPosition,
    head: [['#', 'University Name', 'Location', 'Type', 'Ranking', 'Match', 'Category', 'Tuition (USD)']],
    body: universityData,
    theme: 'striped',
    headStyles: { 
      fillColor: [59, 130, 246], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold' 
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 25 }
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Add page numbers
      const pageNum = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Page ${currentPage} of ${pageNum}`,
        pageWidth - margin - 20,
        doc.internal.pageSize.height - 10
      );
    }
  });
  
  // Add detailed information for each university
  let detailsStartY = doc.lastAutoTable.finalY + 20;
  
  universities.forEach((uni, index) => {
    // Check if we need a new page
    if (detailsStartY > doc.internal.pageSize.height - 80) {
      doc.addPage();
      detailsStartY = 25;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text(`${index + 1}. ${uni.name}`, margin, detailsStartY);
    
    detailsStartY += 8;
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    
    // University details
    const details = [];
    
    if (uni.description) {
      details.push(`Description: ${uni.description.substring(0, 200)}${uni.description.length > 200 ? '...' : ''}`);
    }
    
    if (uni.programs?.length > 0) {
      details.push(`Programs: ${uni.programs.slice(0, 3).join(', ')}${uni.programs.length > 3 ? '...' : ''}`);
    }
    
    if (uni.requirements) {
      const req = uni.requirements;
      if (req.minimumCGPA) details.push(`Min CGPA: ${req.minimumCGPA}/10`);
      if (req.englishProficiency?.ielts) details.push(`IELTS: ${req.englishProficiency.ielts}/9`);
      if (req.englishProficiency?.toefl) details.push(`TOEFL: ${req.englishProficiency.toefl}/120`);
      if (req.gre?.required) details.push(`GRE Required: Yes`);
    }
    
    if (uni.applicationDeadlines?.fall) {
      details.push(`Fall Deadline: ${uni.applicationDeadlines.fall}`);
    }
    
    if (uni.website) {
      details.push(`Website: ${uni.website}`);
    }
    
    // Add details with proper line wrapping
    details.forEach(detail => {
      const lines = doc.splitTextToSize(detail, pageWidth - 2 * margin);
      lines.forEach(line => {
        doc.text(line, margin + 5, detailsStartY);
        detailsStartY += 5;
      });
    });
    
    detailsStartY += 5; // Space between universities
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const footerY = doc.internal.pageSize.height - 20;  doc.text('Generated by UniGuidePro - Your AI Study Abroad Assistant', margin, footerY);
  doc.text('Visit: www.uniguidepro.com | Contact: support@uniguidepro.com', margin, footerY + 5);
  
  // Save the PDF
  const fileName = `UniGuidePro_University_Shortlist_${date.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

/**
 * Export university comparison as PDF
 * @param {Array} universities - Array of universities to compare (max 3)
 * @param {string} userEmail - User's email
 */
export const exportComparisonPDF = (universities, userEmail = '') => {
  const doc = new jsPDF('landscape'); // Landscape for better comparison view
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text('UniGuidePro - University Comparison', margin, 25);
  
  // Date and user info
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const date = new Date().toLocaleDateString();
  doc.text(`Generated on: ${date}`, margin, 35);
  
  if (userEmail) {
    doc.text(`Student: ${userEmail}`, margin, 42);
  }
  
  let yPosition = 55;
  
  // Comparison table
  const comparisonData = [
    ['University Name', ...universities.map(uni => uni.name)],
    ['Location', ...universities.map(uni => `${uni.location?.city || ''}, ${uni.location?.country || ''}`)],
    ['Type', ...universities.map(uni => uni.type || 'University')],
    ['World Ranking', ...universities.map(uni => uni.ranking?.world ? `#${uni.ranking.world}` : 'Unranked')],
    ['Match Score', ...universities.map(uni => uni.matchScore ? `${Math.round(uni.matchScore)}%` : 'N/A')],
    ['Category', ...universities.map(uni => uni.category || 'Target')],
    ['Tuition Range (USD)', ...universities.map(uni => 
      uni.tuitionRange 
        ? `$${uni.tuitionRange.min?.toLocaleString()} - $${uni.tuitionRange.max?.toLocaleString()}`
        : 'Not specified'
    )],
    ['Min CGPA', ...universities.map(uni => uni.requirements?.minimumCGPA || 'N/A')],
    ['IELTS Required', ...universities.map(uni => uni.requirements?.englishProficiency?.ielts || 'N/A')],
    ['TOEFL Required', ...universities.map(uni => uni.requirements?.englishProficiency?.toefl || 'N/A')],
    ['GRE Required', ...universities.map(uni => uni.requirements?.gre?.required ? 'Yes' : 'No')],
    ['Fall Deadline', ...universities.map(uni => uni.applicationDeadlines?.fall || 'N/A')],
    ['Website', ...universities.map(uni => uni.website || 'N/A')]
  ];
  
  doc.autoTable({
    startY: yPosition,
    head: [comparisonData[0]],
    body: comparisonData.slice(1),
    theme: 'striped',
    headStyles: { 
      fillColor: [59, 130, 246], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold' 
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 }
    },
    margin: { left: margin, right: margin }
  });
  
  // Add program details for each university
  let detailsY = doc.lastAutoTable.finalY + 20;
  
  universities.forEach((uni, index) => {
    if (detailsY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      detailsY = 25;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text(`${uni.name} - Program Details`, margin, detailsY);
    
    detailsY += 8;
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    
    if (uni.programs?.length > 0) {
      const programText = `Available Programs: ${uni.programs.join(', ')}`;
      const lines = doc.splitTextToSize(programText, pageWidth - 2 * margin);
      lines.forEach(line => {
        doc.text(line, margin + 5, detailsY);
        detailsY += 5;
      });
    }
    
    if (uni.description) {
      detailsY += 3;
      const descText = `Description: ${uni.description}`;
      const lines = doc.splitTextToSize(descText, pageWidth - 2 * margin);
      lines.forEach(line => {
        doc.text(line, margin + 5, detailsY);
        detailsY += 5;
      });
    }
    
    detailsY += 10; // Space between universities
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const footerY = doc.internal.pageSize.height - 15;
  doc.text('Generated by UniGuidePro - Your AI Study Abroad Assistant', margin, footerY);
  
  // Save the PDF
  const fileName = `UniGuidePro_University_Comparison_${date.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
