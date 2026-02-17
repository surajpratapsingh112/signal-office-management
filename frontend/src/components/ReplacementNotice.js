import React from 'react';

const ReplacementNotice = ({ replacement, onClose }) => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  const getGateAndTime = (slot) => {
    const gateMap = {
      'MAIN_MORNING': { gate: 'Main Gate', time: '0600-1400 hours' },
      'MAIN_EVENING': { gate: 'Main Gate', time: '1400-2200 hours' },
      'SCHOOL_MORNING': { gate: 'Training School Gate', time: '0600-1400 hours' },
      'SCHOOL_EVENING': { gate: 'Training School Gate', time: '1400-2200 hours' }
    };
    return gateMap[slot] || { gate: '', time: '' };
  };

  const gateInfo = getGateAndTime(replacement.slot);
  const dutyDate = formatDate(new Date(replacement.year, replacement.month - 1, replacement.date));
  const issueDate = formatDate(new Date());

  const permanentEmployee = replacement.permanentEmployee?.name || 'N/A';
  const permanentRank = replacement.permanentEmployee?.rank || '';
  
  const replacementEmployee = replacement.replacementEmployee?.name || 'N/A';
  const replacementRank = replacement.replacementEmployee?.rank || '';
  const replacementUnit = typeof replacement.replacementEmployee?.currentUnit === 'object' 
    ? replacement.replacementEmployee?.currentUnit?.name 
    : replacement.replacementEmployee?.currentUnit || 'Office';

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Gate Duty Replacement Notice</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            background: white;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .letterhead {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .letterhead h1 {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .letterhead h2 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .letterhead h3 {
            font-size: 16px;
            color: #333;
            margin-bottom: 15px;
          }
          
          .letterhead hr {
            border: none;
            border-top: 2px solid #333;
            margin: 20px auto;
            width: 75%;
          }
          
          .date, .subject {
            margin-bottom: 20px;
            font-size: 16px;
          }
          
          .subject {
            font-weight: 600;
          }
          
          .content {
            text-align: justify;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
          }
          
          .content p {
            margin-bottom: 15px;
            text-indent: 48px;
          }
          
          .signature {
            text-align: right;
            margin-top: 60px;
          }
          
          .signature p {
            font-size: 16px;
          }
          
          .signature .name {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .signature .designation {
            font-size: 14px;
            color: #333;
          }
          
          .copy-to {
            margin-top: 40px;
            font-size: 16px;
          }
          
          .copy-to p {
            font-weight: 600;
            margin-bottom: 10px;
          }
          
          .copy-to ol {
            list-style-position: inside;
            margin-left: 0;
          }
          
          .copy-to li {
            margin-bottom: 5px;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .container {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Letterhead -->
          <div class="letterhead">
            <h1>Office</h1>
            <h2>Radio Inspector, Signal</h2>
            <h3>Headquarters, Lucknow</h3>
            <hr>
          </div>

          <!-- Date -->
          <div class="date">
            <strong>Date:</strong> ${issueDate}
          </div>

          <!-- Subject -->
          <div class="subject">
            <strong>Subject:</strong> Gate Duty Replacement
          </div>

          <!-- Content -->
          <div class="content">
            <p>
              This is to inform you that Shri/Smt. <strong>${permanentEmployee}</strong> (${permanentRank}) 
              who was assigned gate duty on <strong>${dutyDate}</strong> at <strong>${gateInfo.gate}</strong> 
              (<strong>${gateInfo.time}</strong>) will now be replaced by Shri/Smt. <strong>${replacementEmployee}</strong> 
              (${replacementRank}) who will perform the said duty.
            </p>

            <p>
              For kind information and necessary action please.
            </p>
          </div>

          <!-- Signature -->
          <div class="signature">
            <p class="name">RI SIGNAL</p>
            <p class="designation">RHQ LKW</p>
          </div>

          <!-- Copy To -->
          <div class="copy-to">
            <p>Copy to:</p>
            <ol>
              <li>RI LINE</li>
              <li>I/C G.D</li>
              <li>OFFICE COPY</li>
              <li>I/C Sub Unit ${replacementUnit}</li>
            </ol>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Gate Duty Replacement Notice</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-500 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notice Preview */}
        <div className="p-12">
          {/* Letterhead */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-800">
              Office
            </h1>
            <h2 className="text-lg font-semibold text-gray-700 mt-1">
              Radio Inspector, Signal
            </h2>
            <h3 className="text-base text-gray-600 mt-1">
              Headquarters, Lucknow
            </h3>
            <div className="border-b-2 border-gray-400 mt-4 mb-6 mx-auto w-3/4"></div>
          </div>

          {/* Date */}
          <div className="mb-6">
            <p className="text-base">
              <span className="font-semibold">Date:</span> {issueDate}
            </p>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <p className="text-base">
              <span className="font-semibold">Subject:</span> Gate Duty Replacement
            </p>
          </div>

          {/* Main Content */}
          <div className="mb-8 text-base leading-relaxed text-justify space-y-4">
            <p className="indent-12">
              This is to inform you that Shri/Smt. <span className="font-semibold">{permanentEmployee}</span> ({permanentRank}) who was assigned gate duty on <span className="font-semibold">{dutyDate}</span> at <span className="font-semibold">{gateInfo.gate}</span> (<span className="font-semibold">{gateInfo.time}</span>) will now be replaced by Shri/Smt. <span className="font-semibold">{replacementEmployee}</span> ({replacementRank}) who will perform the said duty.
            </p>

            <p className="indent-12">
              For kind information and necessary action please.
            </p>
          </div>

          {/* Signature */}
          <div className="flex justify-end mt-20">
            <div className="text-center">
              <p className="font-bold text-base">RI SIGNAL</p>
              <p className="text-sm text-gray-600 mt-1">RHQ LKW</p>
            </div>
          </div>

          {/* Copy To - Moved below signature */}
          <div className="mt-12">
            <p className="font-semibold text-base mb-2">Copy to:</p>
            <ol className="space-y-1 text-base ml-0">
              <li>1. RI LINE</li>
              <li>2. I/C G.D</li>
              <li>3. OFFICE COPY</li>
              <li>4. I/C {replacementUnit}</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-8 py-4 rounded-b-lg flex gap-4 justify-end border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Notice
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplacementNotice;