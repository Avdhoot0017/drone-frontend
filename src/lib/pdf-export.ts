/**
 * PDF Export Utility - Creates PDF reports with charts/graphs
 * Uses html-to-image to capture rendered content and jsPDF to generate PDF
 * Handles page breaks intelligently to avoid cutting charts
 */

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface ExportOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Capture a single element as PNG data URL
 */
async function captureElement(element: HTMLElement): Promise<string> {
  return toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    skipFonts: true,
    filter: (node) => {
      if (node instanceof Element) {
        const tagName = node.tagName.toLowerCase();
        if (tagName === 'script' || tagName === 'noscript') {
          return false;
        }
      }
      return true;
    },
  });
}

/**
 * Load image and get dimensions
 */
async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });
  return img;
}

/**
 * Export a DOM element to PDF with intelligent page breaks
 * Each major section (Card, grid row) is captured separately to avoid cutting
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    title = 'Dashboard Report',
    subtitle,
    filename = `Dashboard_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
    orientation = 'landscape',
  } = options;

  // PDF dimensions
  const pageWidth = orientation === 'portrait' ? 210 : 297; // A4 width in mm
  const pageHeight = orientation === 'portrait' ? 297 : 210; // A4 height in mm
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  const headerHeight = subtitle ? 32 : 25; // Increased if subtitle present
  const footerHeight = 10;
  const usableHeight = pageHeight - headerHeight - footerHeight;

  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Find all sections to capture separately
  // Look for grid rows, cards, or elements with data-pdf-section attribute
  const sections: HTMLElement[] = [];

  // First, try to find direct children that are grid containers or separators
  const children = Array.from(element.children) as HTMLElement[];

  for (const child of children) {
    if (child.tagName.toLowerCase() === 'hr' ||
        child.getAttribute('role') === 'separator' ||
        child.classList.contains('separator')) {
      continue; // Skip separators
    }
    sections.push(child);
  }

  // If no sections found, capture the whole element
  if (sections.length === 0) {
    sections.push(element);
  }

  let currentY = headerHeight;
  let currentPage = 1;

  // Add header to first page
  const addHeader = (pageNum: number) => {
    pdf.setFontSize(16);
    pdf.setTextColor(220, 38, 38);
    pdf.text(title, pageWidth / 2, 12, { align: 'center' });

    if (subtitle) {
      pdf.setFontSize(11);
      pdf.setTextColor(55, 65, 81);
      pdf.text(subtitle, pageWidth / 2, 19, { align: 'center' });

      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Generated on: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}`, pageWidth / 2, 26, { align: 'center' });
    } else {
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Generated on: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}`, pageWidth / 2, 18, { align: 'center' });
    }
  };

  addHeader(currentPage);

  // Process each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    try {
      // Capture section as image
      const dataUrl = await captureElement(section);
      const img = await loadImage(dataUrl);

      // Calculate scaled dimensions
      const imgHeight = (img.height * contentWidth) / img.width;

      // Check if section fits on current page
      if (currentY + imgHeight > pageHeight - footerHeight) {
        // Need new page
        pdf.addPage();
        currentPage++;
        currentY = margin;
        addHeader(currentPage);
        currentY = headerHeight;
      }

      // If single section is taller than page, we need to split it
      if (imgHeight > usableHeight) {
        // Section is too tall - split across pages
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0);

          let heightLeft = imgHeight;
          let sourceY = 0;

          while (heightLeft > 0) {
            const availableHeight = currentPage === 1 && sourceY === 0
              ? usableHeight
              : pageHeight - margin - footerHeight - (currentY === headerHeight ? 0 : currentY - margin);

            const portionHeight = Math.min(availableHeight, heightLeft);
            const sourceHeight = (portionHeight / imgHeight) * img.height;

            // Create temp canvas for this portion
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = sourceHeight;
            const tempCtx = tempCanvas.getContext('2d');

            if (tempCtx) {
              tempCtx.drawImage(
                canvas,
                0, sourceY, img.width, sourceHeight,
                0, 0, img.width, sourceHeight
              );

              const portionDataUrl = tempCanvas.toDataURL('image/png');
              pdf.addImage(portionDataUrl, 'PNG', margin, currentY, contentWidth, portionHeight);
            }

            sourceY += sourceHeight;
            heightLeft -= portionHeight;

            if (heightLeft > 0) {
              pdf.addPage();
              currentPage++;
              currentY = margin;
              addHeader(currentPage);
              currentY = headerHeight;
            } else {
              currentY += portionHeight + 3;
            }
          }
        }
      } else {
        // Section fits - add it
        pdf.addImage(dataUrl, 'PNG', margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 3; // 3mm gap between sections
      }
    } catch (err) {
      console.error('Error capturing section:', err);
      // Continue with next section
    }
  }

  // Add footer with page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Save the PDF
  pdf.save(filename);
}

/**
 * Export dashboard content by ID to PDF
 */
export async function exportDashboardToPdf(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }

  return exportElementToPdf(element, options);
}
