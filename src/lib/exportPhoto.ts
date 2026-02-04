import jsPDF from 'jspdf';

/**
 * Export canvas as PNG file (2x2" at 300 DPI = 600x600px)
 */
export function exportAsPNG(canvas: HTMLCanvasElement, filename: string = 'passport-photo.png'): void {
  // Ensure canvas is 600x600px for 2x2" at 300 DPI
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 600;
  exportCanvas.height = 600;
  
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Draw the source canvas to the export canvas
  ctx.drawImage(canvas, 0, 0, 600, 600);
  
  // Trigger download
  exportCanvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create image blob');
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Export canvas as 4x6" print sheet with 4 passport photos in 2x2 grid
 */
export function exportAsPrintSheet(canvas: HTMLCanvasElement, filename: string = 'passport-photo-print-sheet.pdf'): void {
  // Create 4x6" PDF at 300 DPI
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [4, 6],
  });
  
  // Convert canvas to image data
  const imgData = canvas.toDataURL('image/png');
  
  // Each photo is 2x2", arranged in 2x2 grid on 4x6" sheet
  // Add small gaps between photos (0.1" gap)
  const photoSize = 2; // inches
  const gap = 0.1; // inches
  
  // Calculate positions for 2x2 grid
  const positions = [
    { x: 0, y: 0 }, // Top-left
    { x: photoSize + gap, y: 0 }, // Top-right
    { x: 0, y: photoSize + gap }, // Bottom-left
    { x: photoSize + gap, y: photoSize + gap }, // Bottom-right
  ];
  
  // Add 4 photos
  positions.forEach((pos) => {
    pdf.addImage(imgData, 'PNG', pos.x, pos.y, photoSize, photoSize);
  });
  
  // Add cut lines around each photo (thin gray lines)
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.01);
  
  positions.forEach((pos) => {
    // Draw rectangle around each photo
    pdf.rect(pos.x, pos.y, photoSize, photoSize);
  });
  
  // Add label at the bottom
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const labelText = `US Passport Photo - ${today}`;
  const textWidth = pdf.getTextWidth(labelText);
  const centerX = (4 - textWidth) / 2;
  pdf.text(labelText, centerX, 5.8);
  
  // Add cutting instructions
  pdf.setFontSize(7);
  const instructionText = 'Cut along the gray lines';
  const instructionWidth = pdf.getTextWidth(instructionText);
  const instructionX = (4 - instructionWidth) / 2;
  pdf.text(instructionText, instructionX, 5.6);
  
  // Save PDF
  pdf.save(filename);
}
