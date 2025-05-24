import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export saved universities as PDF
 * @param {Array} universities - Array of university objects to export
 * @param {Object} userProfile - User's academic profile
 * @param {string} userEmail - User's email
 */
export const exportUniversitiesPDF = (universities, userProfile = null, userEmail = '') => {
  if (!universities || universities.length === 0) {
    console.error('No universities provided for PDF export');
    throw new Error('No universities to export');
  }

  try {
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
  return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Export university comparison as PDF
 * @param {Array} universities - Array of universities to compare (no limit)
 * @param {string} userEmail - User's email
 */
export const exportComparisonPDF = (universities, userEmail = '') => {
  if (!universities || universities.length === 0) {
    console.error('No universities provided for comparison PDF export');
    return;
  }

  try {
    const doc = new jsPDF('landscape'); // Landscape for better comparison view
    
    // Check if autoTable is available
    if (typeof doc.autoTable !== 'function') {
      console.error('jspdf-autotable plugin not loaded properly');
      throw new Error('PDF table functionality not available');
    }
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text('UniGuidePro - University Comparison', margin, 20);
  
  // Date and user info
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const date = new Date().toLocaleDateString();
  doc.text(`Generated on: ${date}`, margin, 28);
  
  if (userEmail) {
    doc.text(`Student: ${userEmail}`, margin, 34);
  }
  
  doc.text(`Comparing ${universities.length} universities`, margin, 40);
  
  let yPosition = 50;
  
  // If more than 4 universities, create multiple comparison tables
  const universitiesPerPage = Math.min(4, universities.length);
  const totalPages = Math.ceil(universities.length / universitiesPerPage);
  
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage();
      yPosition = 25;
    }
    
    const startIndex = page * universitiesPerPage;
    const endIndex = Math.min(startIndex + universitiesPerPage, universities.length);
    const pageUniversities = universities.slice(startIndex, endIndex);
    
    if (totalPages > 1) {
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text(`Comparison ${page + 1} of ${totalPages} (Universities ${startIndex + 1}-${endIndex})`, margin, yPosition);
      yPosition += 10;
    }
    
    // Comparison table for this page
    const comparisonData = [
      ['Criteria', ...pageUniversities.map(uni => uni.name || 'Unknown')],
      ['Location', ...pageUniversities.map(uni => 
        `${uni.location?.city || uni.city || ''}, ${uni.location?.country || uni.country || ''}`.replace(/^, |, $/, '')
      )],
      ['Type', ...pageUniversities.map(uni => uni.type || 'University')],
      ['World Ranking', ...pageUniversities.map(uni => uni.ranking?.world ? `#${uni.ranking.world}` : 'Unranked')],
      ['Match Score', ...pageUniversities.map(uni => uni.matchScore ? `${Math.round(uni.matchScore)}%` : 'N/A')],
      ['Category', ...pageUniversities.map(uni => uni.category || 'Target')],
      ['Tuition Range (USD)', ...pageUniversities.map(uni => 
        uni.tuitionRange 
          ? `$${uni.tuitionRange.min?.toLocaleString()} - $${uni.tuitionRange.max?.toLocaleString()}`
          : uni.tuitionFees ? `$${uni.tuitionFees.toLocaleString()}` : 'Not specified'
      )],
      ['Min CGPA', ...pageUniversities.map(uni => uni.requirements?.minimumCGPA || uni.minimumCGPA || 'N/A')],
      ['IELTS Required', ...pageUniversities.map(uni => 
        uni.requirements?.englishProficiency?.ielts || uni.ieltsScore || 'N/A'
      )],
      ['TOEFL Required', ...pageUniversities.map(uni => 
        uni.requirements?.englishProficiency?.toefl || uni.toeflScore || 'N/A'
      )],
      ['GRE Required', ...pageUniversities.map(uni => 
        uni.requirements?.gre?.required ? 'Yes' : uni.greRequired ? 'Yes' : 'No'
      )],
      ['Fall Deadline', ...pageUniversities.map(uni => 
        uni.applicationDeadlines?.fall || uni.applicationDeadline || 'N/A'
      )],
      ['Website', ...pageUniversities.map(uni => uni.website || 'N/A')]
    ];
    
    // Calculate column widths dynamically
    const availableWidth = pageWidth - 2 * margin;
    const criteriaWidth = 50;
    const universityWidth = (availableWidth - criteriaWidth) / pageUniversities.length;
    
    doc.autoTable({
      startY: yPosition,
      head: [comparisonData[0]],
      body: comparisonData.slice(1),
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { 
        fontSize: 7, 
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: criteriaWidth, halign: 'left' },
        ...Object.fromEntries(
          pageUniversities.map((_, index) => [index + 1, { cellWidth: universityWidth }])
        )
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto'
    });
    
    // Add program details for universities on this page
    let detailsY = doc.lastAutoTable.finalY + 15;
    
    pageUniversities.forEach((uni, index) => {
      if (detailsY > pageHeight - 40) {
        doc.addPage();
        detailsY = 25;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.text(`${uni.name} - Additional Details`, margin, detailsY);
      
      detailsY += 6;
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      
      const details = [];
      
      if (uni.programs?.length > 0) {
        details.push(`Programs: ${uni.programs.slice(0, 5).join(', ')}${uni.programs.length > 5 ? '...' : ''}`);
      }
      
      if (uni.description) {
        details.push(`Description: ${uni.description.substring(0, 150)}${uni.description.length > 150 ? '...' : ''}`);
      }
      
      if (uni.establishedYear) {
        details.push(`Established: ${uni.establishedYear}`);
      }
      
      if (uni.studentPopulation) {
        details.push(`Students: ${uni.studentPopulation.toLocaleString()}`);
      }
      
      details.forEach(detail => {
        const lines = doc.splitTextToSize(detail, pageWidth - 2 * margin);
        lines.forEach(line => {
          if (detailsY > pageHeight - 25) {
            doc.addPage();
            detailsY = 25;
          }
          doc.text(line, margin + 5, detailsY);
          detailsY += 4;
        });
      });
      
      detailsY += 5; // Space between universities
    });
  }
  
  // Add page numbers to all pages
  const totalPagesCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Page ${i} of ${totalPagesCount}`,
      pageWidth - margin - 25,
      pageHeight - 10
    );
  }
  
  // Footer on last page
  doc.setPage(totalPagesCount);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const footerY = pageHeight - 20;
  doc.text('Generated by UniGuidePro - Your AI Study Abroad Assistant', margin, footerY);
    // Save the PDF
  const fileName = `UniGuidePro_University_Comparison_${universities.length}_Universities_${date.replace(/\//g, '-')}.pdf`;
  try {
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
  
  } catch (error) {
    console.error('Error generating comparison PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};
