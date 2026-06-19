'use client';

/**
 * Case Preview Dialog - Shows the Marathi case document preview
 * matching the new template format (Case Draft-template.docx)
 */

import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check, Printer } from 'lucide-react';

interface CasePreviewData {
  // Vessel info
  vesselName: string;
  registrationNumber: string;
  vesselType?: string;

  // Owner info
  ownerName: string;

  // Location
  districtName: string;
  flyingLocationName: string;
  latitude: string;
  longitude: string;

  // Violation
  violationTypeName: string;
  fishingLicenseTypeName: string;
  observationDate: string;

  // Penalty
  processingFee: number;
  violationPenalty: number;
  totalPenalty: number;
  occurrence: number;

  // Evidence images (base64 or URLs)
  images?: string[];
}

interface CasePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CasePreviewData;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function CasePreviewDialog({
  open,
  onOpenChange,
  data,
  onConfirm,
  isSubmitting,
}: CasePreviewDialogProps) {
  const currentDate = format(new Date(), 'dd/MM/yyyy');
  const observationDateFormatted = data.observationDate
    ? format(new Date(data.observationDate), 'dd/MM/yyyy')
    : currentDate;

  // Hearing date is 7 days from now
  const hearingDate = format(addDays(new Date(), 7), 'dd/MM/yyyy');
  const hearingTime = '11:00';

  // Format penalty in lakhs
  const formatInLakhs = (amount: number) => {
    const lakhs = amount / 100000;
    return lakhs.toFixed(2);
  };

  // Generate case number
  const caseNumber = `XXXXX`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 border border-gray-300 shadow-2xl" style={{ backgroundColor: '#ffffff' }}>
        <DialogHeader className="px-6 pt-6 pb-0" style={{ backgroundColor: '#ffffff' }}>
          <DialogTitle className="flex items-center justify-between">
            <span>केस प्रिव्ह्यू / Case Preview</span>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]" style={{ backgroundColor: '#ffffff' }}>
          <div className="px-6 py-4" style={{ backgroundColor: '#ffffff' }}>
            {/* Marathi Document Preview - New Template Format */}
            <div
              className="border border-gray-300 rounded-lg p-8 text-black print:border-none print:p-0"
              style={{ backgroundColor: '#ffffff', fontFamily: 'Noto Sans Devanagari, Mangal, sans-serif' }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold">
                  मा.अभिनिर्णय अधिकारी तथा सहाय्यक आयुक्त मत्स्यव्यवसाय, <span className="underline">{data.districtName || '___________'}</span> याचे न्यायालयात
                </h2>
                <h3 className="text-md font-bold mt-2">
                  प्रतिवृत्त/प्रतिवेदन
                </h3>
                <p className="text-sm">
                  (महाराष्ट्र सागरी मासेमारी नियमन (सुधारणा) अधिनियम, 2021 कलम 16 अन्वये)
                </p>
              </div>

              {/* Case Number and Date */}
              <div className="flex justify-between mb-6">
                <p>केस क्र. <span className="font-semibold">{caseNumber}</span>/2026</p>
                <p>दिनांक- <span className="font-semibold">{currentDate}</span></p>
              </div>

              {/* Addressee */}
              <div className="mb-6">
                <p className="mb-2">प्रति,</p>
                <p className="ml-4">अभिनिर्णय अधिकारी, {data.districtName || '___________'} तथा</p>
                <p className="ml-4">सहाय्यक आयुक्त मत्स्यव्यवसाय (जि. {data.districtName || '___________'}),</p>
              </div>

              {/* References */}
              <div className="mb-6">
                <p className="font-semibold mb-2">वाचा-</p>
                <ol className="list-decimal ml-8 space-y-1">
                  <li>महाराष्ट्र सागरी मासेमारी नियमन अधिनियम, 1981</li>
                  <li>महाराष्ट्र सागरी मासेमारी नियमन (सुधारणा) अधिनियम, 2021</li>
                </ol>
              </div>

              {/* Main Content - Vessel and Owner Details */}
              <div className="mb-6">
                <p className="text-justify leading-relaxed">
                  सामनेवाला श्री. <span className="font-semibold underline">{data.ownerName || '_______________'}</span> यांच्या
                  मालकीची नौका नाव <span className="font-semibold underline">{data.vesselName || '_______________'}</span> क्रमांक-
                  <span className="font-semibold underline">{data.registrationNumber || '_______________'}</span> या नौकेस
                  विभागामार्फत <span className="font-semibold underline">{data.vesselType || data.fishingLicenseTypeName || 'पर्ससीन'}</span> पध्दतीची नोंदणी करण्यात आलेली आहे.
                </p>
              </div>

              {/* Observation Details */}
              <div className="mb-6">
                <p className="text-justify leading-relaxed">
                  ड्रोन यंत्रप्रणालीद्वारे <span className="font-semibold">{data.districtName || '___________'}</span> जिल्ह्याच्या जलधी क्षेत्रात गस्त घालुन
                  नियंत्रण व देखरेख करित असताना मासेमारी नौका नाव
                  <span className="font-semibold underline"> {data.vesselName || '___________'} </span>
                  क्रमांक <span className="font-semibold underline">{data.registrationNumber || '___________'}</span> ही
                  रेखांश <span className="font-semibold underline">{data.longitude || '___________'}</span>,
                  अक्षांश <span className="font-semibold underline">{data.latitude || '___________'}</span> या ठिकाणी
                  अनधिकृतरित्या पर्ससीन/एलईडी/ट्रॉलिंग/इतर पध्दतीने मासेमारी करित असल्याचे निदर्शनास आलेली आहे.
                </p>
              </div>

              {/* Violation Description */}
              <div className="mb-6">
                <p className="text-justify leading-relaxed">
                  सदर नौकेमार्फत महाराष्ट्र सागरी मासेमारी नियमन अधिनियम (सुधारणा), 2021 कायद्यामधील तरतुदीचे भंग करुन
                  मासेमारी करित असल्याचे दिसुन आल्याने उक्त कायद्यामधील कलम 16 मधील तरतुदी अन्वये आपल्याकडे प्रतिवृत्त दाखल करण्यात येत आहे.
                </p>
              </div>

              {/* Violations Table Header */}
              <div className="mb-2">
                <p className="font-semibold">नौकेमार्फत करण्यात आलेले उल्लघंन व इतर बाबीचा तपशिल खालील प्रमाणे आहे.</p>
              </div>

              {/* Penalty Table */}
              <div className="mb-6">
                <table className="w-full border-collapse border border-gray-400" style={{ backgroundColor: '#ffffff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th className="border border-gray-400 p-2 text-center font-semibold w-16">अ.क्र.</th>
                      <th className="border border-gray-400 p-2 text-left font-semibold">उल्लघंन तपशिल</th>
                      <th className="border border-gray-400 p-2 text-center font-semibold w-32">कलम तपशिल</th>
                      <th className="border border-gray-400 p-2 text-center font-semibold w-40">प्रस्तावित शास्ती तपशिल</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#ffffff' }}>
                      <td className="border border-gray-400 p-2 text-center">1</td>
                      <td className="border border-gray-400 p-2">परवानाच्या अटी व शर्तिंचे उल्लंघन</td>
                      <td className="border border-gray-400 p-2 text-center">कलम 17 (३) (फ)</td>
                      <td className="border border-gray-400 p-2 text-center font-semibold">
                        रू. {formatInLakhs(data.totalPenalty)} लक्ष
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#ffffff' }}>
                      <td className="border border-gray-400 p-2 text-center">2</td>
                      <td className="border border-gray-400 p-2"></td>
                      <td className="border border-gray-400 p-2"></td>
                      <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr className="font-bold" style={{ backgroundColor: '#f9fafb' }}>
                      <td className="border border-gray-400 p-2" colSpan={2}></td>
                      <td className="border border-gray-400 p-2 text-center font-semibold">एकुण दंड</td>
                      <td className="border border-gray-400 p-2 text-center text-red-600">
                        रु. {formatInLakhs(data.totalPenalty)} लक्ष
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Request for Maximum Penalty */}
              <div className="mb-6">
                <p className="text-justify leading-relaxed">
                  तरी, सदर नौकेमार्फत सागरी कायद्याचे उल्लघंन केले असल्याचे निदर्शनास आल्याने शाश्वत मासेमारी टीकुन राहण्याच्या दृष्टीने
                  व मत्स्यसाठयाचे संवर्धन होण्याकरिता महाराष्ट्र सागरी मासेमारी नियमन अधिनियम (सुधारणा), 2021 कायद्यामधील
                  कलम १७ मधील तरतुदीनुसार जास्तीस जास्त शास्ती लादण्याबाबत आपणांस विनंती करण्यात येत आहे.
                </p>
              </div>

              {/* Signature - First Page */}
              <div className="mb-8 text-right">
                <p className="font-semibold">फिर्यादी तथा अंमलबजावणी अधिकारी</p>
                <p>सहाय्यक मत्स्यव्यवसाय विकास अधिकारी (परवाना अधिकारी)</p>
              </div>

              {/* Evidence Attachment Note */}
              <div className="mb-8 text-sm text-gray-700">
                <p>सोबत : विभागाच्या ड्रोन द्वारे प्राप्त झालेले छायाचित्र (भारतीय साक्ष अधिनियम 2023 कलम 63)</p>
              </div>

              {/* Page Break - Hearing Notice */}
              <div className="border-t-2 border-black pt-6 mt-8">
                {/* Government Header */}
                <div className="text-center mb-4">
                  <p className="font-bold">महाराष्ट्र शासन</p>
                  <p className="font-bold">मत्स्यव्यवसाय विभाग</p>
                </div>

                <div className="flex justify-between mb-4">
                  <p>अभिनिर्णय अधिकारी तथा सहाय्यक मत्स्यव्यवसाय जि.(<span className="font-semibold">{data.districtName || '___'}</span>)</p>
                  <div className="text-right">
                    <p>केस क्र. <span className="font-semibold">{caseNumber}</span>/2026</p>
                    <p>दि. <span className="font-semibold">{currentDate}</span></p>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold underline">सुनावणी ची नोटिस</h3>
                </div>

                {/* Parties in Hearing Notice */}
                <div className="mb-4">
                  <p>महाराष्ट्र शासनातर्फे फिर्यादी सहाय्यक आयुक्त मत्स्यव्यवसाय विकास अधिकारी</p>
                  <p>(अंमलबजावणी अधिकारी), तथा परवाना अधिकारी <span className="font-semibold">{data.flyingLocationName || '___________'}</span></p>
                  <p className="text-right font-semibold">फीर्यादी</p>
                </div>

                <div className="text-center font-bold my-4">विरूध्द</div>

                <div className="mb-4">
                  <p>नाव: <span className="font-semibold underline">{data.ownerName || '_______________'}</span>,
                     रा._______________ता.<span className="font-semibold">{data.flyingLocationName || '___'}</span>
                     जि.<span className="font-semibold">{data.districtName || '___'}</span></p>
                  <p>नौकेचे नाव : <span className="font-semibold underline">{data.vesselName || '_______________'}</span>,
                     नौका क्र.<span className="font-semibold underline">{data.registrationNumber || '_______________'}</span></p>
                  <p className="text-right font-semibold">सामनेवाला</p>
                </div>

                {/* Notice Under Act */}
                <div className="mb-6 p-3 border border-gray-300 rounded" style={{ backgroundColor: '#f9fafb' }}>
                  <p className="font-semibold text-center mb-2">
                    महाराष्ट्र सागरी मासेमारी नियमन अधिनियम 1981 व महाराष्ट्र सागरी मासेमारी नियमन (सुधारीत) अध्यादेश, 2021, 16 (1) अन्वये नोटीस
                  </p>
                </div>

                {/* Notice Content */}
                <div className="mb-6">
                  <p className="text-justify leading-relaxed">
                    फिर्यादी यांनी महाराष्ट्र सागरी मासेमारी नियमन अधिनियम 1981 व महाराष्ट्र सागरी मासेमारी नियमन (सुधारीत) अधिनियम, 2021,
                    कलम 16 (1) अन्वये ड्रोन यंत्रप्रणाली द्वारे सागरी गस्ती दरम्यान आपली वरील नमुद नौका विनिर्दिष्ट क्षेत्रात अनधिकृत मासेमारी करताना
                    दि.<span className="font-semibold underline">{observationDateFormatted}</span> रोजी
                    <span className="font-semibold underline"> {data.flyingLocationName || '___________'} </span>या ठिकाणी आढळून आल्याने
                    आपल्या नौकेवर दाखल केलेल्या प्रतिवेदनाची सुनावणी दि.<span className="font-semibold underline">{hearingDate}</span>रोजी
                    दु.<span className="font-semibold underline">{hearingTime}</span> वाजता करणेची ठरविली आहे.
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-justify leading-relaxed">
                    म्हणून तुम्ही अगर तुमचे अधिकृत प्रतिनिधी यांनी सहाय्यक आयुक्त मत्स्यव्यवसाय, जि.<span className="font-semibold">{data.districtName || '___'}</span> येथे हजर रहावे.
                    सदरच्या सुनावणीस आपण गैरहजर राहिल्यास आपले कोणतेही म्हणणे नाही असे गृहित धरून एकतर्फी निकाल दिला जाईल याची नोंद घ्यावी.
                  </p>
                </div>

                {/* Place and Date */}
                <div className="mb-6">
                  <p>ठिकाण - <span className="font-semibold">{data.districtName || '___________'}</span></p>
                  <p>दिनांक - <span className="font-semibold">{currentDate}</span></p>
                </div>

                {/* Final Signature */}
                <div className="text-right mt-8">
                  <p className="font-semibold">(अभिनिर्णय अधिकारी)</p>
                  <p>अभिनिर्णय अधिकारी तथा</p>
                  <p>सहाय्यक आयुक्त मत्स्यव्यवसाय (तां.)</p>
                </div>
              </div>
            </div>

            {/* Page Break - Evidence Images */}
            {data.images && data.images.length > 0 && (
              <div
                className="border border-gray-300 rounded-lg p-8 text-black mt-6 print:break-before-page print:mt-0"
                style={{ backgroundColor: '#ffffff', fontFamily: 'Noto Sans Devanagari, Mangal, sans-serif' }}
              >
                {/* Evidence Header */}
                <div className="text-center mb-6 border-b-2 border-black pb-4">
                  <h2 className="text-lg font-bold">
                    पुरावे / Evidence Images
                  </h2>
                  <p className="text-sm text-gray-600">
                    (ड्रोन यंत्रप्रणालीद्वारे टिपलेले छायाचित्र / Drone Surveillance Photographs)
                  </p>
                </div>

                {/* Case Reference */}
                <div className="mb-6 p-3 border border-gray-300 rounded" style={{ backgroundColor: '#f9fafb' }}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">नौका नाव / Vessel:</span> {data.vesselName}
                    </div>
                    <div>
                      <span className="font-semibold">क्रमांक / Reg:</span> {data.registrationNumber}
                    </div>
                    <div>
                      <span className="font-semibold">दिनांक / Date:</span> {observationDateFormatted}
                    </div>
                    <div>
                      <span className="font-semibold">स्थान / Location:</span> {data.flyingLocationName}, {data.districtName}
                    </div>
                  </div>
                </div>

                {/* Images Grid */}
                <div className="space-y-6">
                  {data.images.map((image, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                        <p className="font-semibold text-sm">
                          छायाचित्र {index + 1} / Image {index + 1}
                        </p>
                      </div>
                      <div className="p-4 flex justify-center" style={{ backgroundColor: '#ffffff' }}>
                        <img
                          src={image}
                          alt={`Evidence ${index + 1}`}
                          className="max-w-full max-h-[400px] object-contain border border-gray-200 rounded"
                        />
                      </div>
                      <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 text-xs text-gray-600">
                        <p>GPS: {data.latitude || 'N/A'}, {data.longitude || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidence Footer */}
                <div className="mt-6 pt-4 border-t border-gray-300 text-sm text-gray-600">
                  <p className="text-center">
                    वरील छायाचित्रे ड्रोन यंत्रप्रणालीद्वारे {observationDateFormatted} रोजी टिपण्यात आली.
                  </p>
                  <p className="text-center">
                    The above photographs were captured by drone surveillance system on {observationDateFormatted}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 print:hidden" style={{ backgroundColor: '#ffffff' }}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Case...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm & Create Case
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
