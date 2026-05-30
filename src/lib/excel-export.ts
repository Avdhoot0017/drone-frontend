/**
 * Excel Export Utility - Creates well-formatted Excel reports
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

// Types for export data
interface ExportStats {
  totalObservations: number;
  uniqueVessels: number;
  pendingActions: number;
  penaltyImposed: number;
  penaltyRecovered: number;
  recoveryRate: number;
}

interface ExportRegion {
  name: string;
  totalObservations: number;
  uniqueVessels: number;
  pendingCases: number;
  penaltyImposed: number;
  penaltyRecovered: number;
}

interface ExportViolation {
  name: string;
  count: number;
  percentage: number;
}

interface ExportVesselType {
  name: string;
  count: number;
  percentage: number;
}

interface ExportData {
  stats: ExportStats | null;
  regions: ExportRegion[];
  violations: ExportViolation[];
  vesselTypes: ExportVesselType[];
  filterInfo?: {
    dateRange?: string;
    district?: string;
  };
}

// Style constants
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDC2626' }, // Red primary color
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const SUBHEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' }, // Light gray
};

const SUBHEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FF374151' },
  size: 10,
};

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
};

const CURRENCY_FORMAT = '₹#,##0';
const PERCENT_FORMAT = '0%';
const NUMBER_FORMAT = '#,##0';

/**
 * Format currency for display
 */
function formatCurrency(num: number): string {
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Apply header styling to a row
 */
function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_STYLE;
  });
  row.height = 25;
}

/**
 * Apply subheader styling to a row
 */
function styleSubheaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = SUBHEADER_FILL;
    cell.font = SUBHEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_STYLE;
  });
  row.height = 22;
}

/**
 * Apply data cell styling
 */
function styleDataRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  row.height = 20;
}

/**
 * Export dashboard data to Excel
 */
export async function exportDashboardToExcel(data: ExportData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Drone Surveillance Dashboard';
  workbook.created = new Date();

  // ========== SUMMARY SHEET ==========
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: 'FFDC2626' } },
  });

  // Title
  summarySheet.mergeCells('A1:D1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'Drone Surveillance Dashboard - Summary Report';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFDC2626' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 35;

  // Report date
  summarySheet.mergeCells('A2:D2');
  const dateCell = summarySheet.getCell('A2');
  dateCell.value = `Generated on: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}`;
  dateCell.font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };
  dateCell.alignment = { horizontal: 'center' };

  // Filter info if applied
  if (data.filterInfo?.dateRange || data.filterInfo?.district) {
    summarySheet.mergeCells('A3:D3');
    const filterCell = summarySheet.getCell('A3');
    const filters: string[] = [];
    if (data.filterInfo.dateRange) filters.push(`Date: ${data.filterInfo.dateRange}`);
    if (data.filterInfo.district) filters.push(`District: ${data.filterInfo.district}`);
    filterCell.value = `Filters: ${filters.join(' | ')}`;
    filterCell.font = { italic: true, size: 10, color: { argb: 'FF9CA3AF' } };
    filterCell.alignment = { horizontal: 'center' };
  }

  // KPI Section
  const kpiStartRow = 5;
  summarySheet.mergeCells(`A${kpiStartRow}:D${kpiStartRow}`);
  const kpiHeader = summarySheet.getCell(`A${kpiStartRow}`);
  kpiHeader.value = 'Key Performance Indicators';
  kpiHeader.font = { bold: true, size: 12 };
  kpiHeader.fill = SUBHEADER_FILL;
  summarySheet.getRow(kpiStartRow).height = 25;

  // KPI Data
  const kpiData = [
    ['Total Observations', data.stats?.totalObservations || 0],
    ['Unique Vessels', data.stats?.uniqueVessels || 0],
    ['Pending Actions', data.stats?.pendingActions || 0],
    ['Penalty Imposed', formatCurrency(data.stats?.penaltyImposed || 0)],
    ['Penalty Recovered', formatCurrency(data.stats?.penaltyRecovered || 0)],
    ['Recovery Rate', `${data.stats?.recoveryRate || 0}%`],
  ];

  kpiData.forEach((row, index) => {
    const rowNum = kpiStartRow + 1 + index;
    summarySheet.getCell(`A${rowNum}`).value = row[0];
    summarySheet.getCell(`B${rowNum}`).value = row[1];
    summarySheet.getCell(`A${rowNum}`).font = { bold: true };
    summarySheet.getCell(`B${rowNum}`).alignment = { horizontal: 'right' };
    styleDataRow(summarySheet.getRow(rowNum));
  });

  // Set column widths
  summarySheet.getColumn('A').width = 25;
  summarySheet.getColumn('B').width = 20;
  summarySheet.getColumn('C').width = 20;
  summarySheet.getColumn('D').width = 20;

  // ========== DISTRICT SHEET ==========
  const districtSheet = workbook.addWorksheet('District Analysis', {
    properties: { tabColor: { argb: 'FF3B82F6' } },
  });

  // Title
  districtSheet.mergeCells('A1:F1');
  const districtTitle = districtSheet.getCell('A1');
  districtTitle.value = 'District-wise Analysis';
  districtTitle.font = { bold: true, size: 14, color: { argb: 'FF3B82F6' } };
  districtTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  districtSheet.getRow(1).height = 30;

  // Headers
  const districtHeaders = ['District', 'Observations', 'Vessels', 'Pending', 'Penalty Imposed', 'Penalty Recovered'];
  const headerRow = districtSheet.getRow(3);
  districtHeaders.forEach((header, index) => {
    headerRow.getCell(index + 1).value = header;
  });
  styleHeaderRow(headerRow);

  // Data
  data.regions.forEach((region, index) => {
    const row = districtSheet.getRow(4 + index);
    row.getCell(1).value = region.name;
    row.getCell(2).value = region.totalObservations;
    row.getCell(3).value = region.uniqueVessels;
    row.getCell(4).value = region.pendingCases;
    row.getCell(5).value = region.penaltyImposed;
    row.getCell(6).value = region.penaltyRecovered;

    // Apply number formats
    row.getCell(2).numFmt = NUMBER_FORMAT;
    row.getCell(3).numFmt = NUMBER_FORMAT;
    row.getCell(4).numFmt = NUMBER_FORMAT;
    row.getCell(5).numFmt = CURRENCY_FORMAT;
    row.getCell(6).numFmt = CURRENCY_FORMAT;

    styleDataRow(row);

    // Right align numbers
    [2, 3, 4, 5, 6].forEach(col => {
      row.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });

  // Totals row
  if (data.regions.length > 0) {
    const totalRow = districtSheet.getRow(4 + data.regions.length);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(2).value = data.regions.reduce((sum, r) => sum + r.totalObservations, 0);
    totalRow.getCell(3).value = data.regions.reduce((sum, r) => sum + r.uniqueVessels, 0);
    totalRow.getCell(4).value = data.regions.reduce((sum, r) => sum + r.pendingCases, 0);
    totalRow.getCell(5).value = data.regions.reduce((sum, r) => sum + r.penaltyImposed, 0);
    totalRow.getCell(6).value = data.regions.reduce((sum, r) => sum + r.penaltyRecovered, 0);

    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = SUBHEADER_FILL;
      cell.border = BORDER_STYLE;
    });
    [2, 3, 4, 5, 6].forEach(col => {
      totalRow.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' };
      if (col >= 5) totalRow.getCell(col).numFmt = CURRENCY_FORMAT;
      else totalRow.getCell(col).numFmt = NUMBER_FORMAT;
    });
  }

  // Set column widths
  districtSheet.getColumn(1).width = 18;
  districtSheet.getColumn(2).width = 15;
  districtSheet.getColumn(3).width = 12;
  districtSheet.getColumn(4).width = 12;
  districtSheet.getColumn(5).width = 18;
  districtSheet.getColumn(6).width = 18;

  // ========== VIOLATIONS SHEET ==========
  const violationSheet = workbook.addWorksheet('Violations', {
    properties: { tabColor: { argb: 'FFF59E0B' } },
  });

  // Title
  violationSheet.mergeCells('A1:C1');
  const violationTitle = violationSheet.getCell('A1');
  violationTitle.value = 'Violation Types Analysis';
  violationTitle.font = { bold: true, size: 14, color: { argb: 'FFF59E0B' } };
  violationTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  violationSheet.getRow(1).height = 30;

  // Headers
  const violationHeaders = ['Violation Type', 'Count', 'Percentage'];
  const vHeaderRow = violationSheet.getRow(3);
  violationHeaders.forEach((header, index) => {
    vHeaderRow.getCell(index + 1).value = header;
  });
  styleHeaderRow(vHeaderRow);

  // Data
  data.violations.forEach((violation, index) => {
    const row = violationSheet.getRow(4 + index);
    row.getCell(1).value = violation.name;
    row.getCell(2).value = violation.count;
    row.getCell(3).value = violation.percentage / 100;

    row.getCell(2).numFmt = NUMBER_FORMAT;
    row.getCell(3).numFmt = PERCENT_FORMAT;

    styleDataRow(row);
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  // Set column widths
  violationSheet.getColumn(1).width = 35;
  violationSheet.getColumn(2).width = 12;
  violationSheet.getColumn(3).width = 12;

  // ========== VESSEL TYPES SHEET ==========
  const vesselSheet = workbook.addWorksheet('Vessel Types', {
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  // Title
  vesselSheet.mergeCells('A1:C1');
  const vesselTitle = vesselSheet.getCell('A1');
  vesselTitle.value = 'Vessel Types Distribution';
  vesselTitle.font = { bold: true, size: 14, color: { argb: 'FF10B981' } };
  vesselTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  vesselSheet.getRow(1).height = 30;

  // Headers
  const vesselHeaders = ['Vessel Type', 'Count', 'Percentage'];
  const vtHeaderRow = vesselSheet.getRow(3);
  vesselHeaders.forEach((header, index) => {
    vtHeaderRow.getCell(index + 1).value = header;
  });
  styleHeaderRow(vtHeaderRow);

  // Data
  data.vesselTypes.forEach((vessel, index) => {
    const row = vesselSheet.getRow(4 + index);
    row.getCell(1).value = vessel.name;
    row.getCell(2).value = vessel.count;
    row.getCell(3).value = vessel.percentage / 100;

    row.getCell(2).numFmt = NUMBER_FORMAT;
    row.getCell(3).numFmt = PERCENT_FORMAT;

    styleDataRow(row);
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  // Set column widths
  vesselSheet.getColumn(1).width = 25;
  vesselSheet.getColumn(2).width = 12;
  vesselSheet.getColumn(3).width = 12;

  // Generate filename with timestamp
  const filename = `Drone_Surveillance_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, filename);
}
