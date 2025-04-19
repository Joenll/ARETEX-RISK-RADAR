'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { FaUpload, FaFileExcel, FaExclamationTriangle, FaCheckCircle, FaSyncAlt, FaTimes, FaSpinner } from 'react-icons/fa';
import Button from '@/app/components/Button'; // Assuming you have a Button component

// --- Types (mirroring backend analysis result) ---
interface ExcelRowData {
    __rowNum__: number;
    CrimeID?: string;
    Date?: string | number | Date;
    Time?: string;
    DayOfWeek?: string;
    CaseStatus?: string;
    EventProximity?: string;
    IndoorsOrOutdoors?: string;
    HouseBuildingNumber?: string;
    StreetName?: string;
    PurokBlockLot?: string;
    Barangay?: string;
    MunicipalityCity?: string;
    Province?: string;
    ZipCode?: string;
    Region?: string;
    CrimeType?: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
    value?: any;
}

interface ProcessedReportInfo {
    row: number;
    crime_id: string;
    // Accept string from analysis, backend confirmation expects string/Date
    date: Date | string;
    time: string;
    day_of_week: string;
    case_status?: 'Ongoing' | 'Resolved' | 'Pending';
    event_proximity?: string;
    crime_occurred_indoors_or_outdoors?: 'Indoors' | 'Outdoors';
    locationId: string;
    crimeTypeId: string;
    excelData: ExcelRowData;
}

interface ImportAnalysisResult {
    fileName: string;
    totalRows: number;
    validNewReports: ProcessedReportInfo[];
    potentialUpdates: ProcessedReportInfo[];
    validationErrors: ValidationError[];
    duplicateValidationErrors: ValidationError[];
}

// Type for the confirmation API response
interface ConfirmationResponse {
    message: string;
    created: number;
    updated: number;
    skippedErrors?: { row: number; crimeId: string; message: string }[];
}

// --- End Types ---

export default function ImportCrimePage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Renamed from isLoading
    const [isConfirming, setIsConfirming] = useState(false); // New state for confirmation step
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // For success feedback
    const [analysisResult, setAnalysisResult] = useState<ImportAnalysisResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0); // Optional for visual feedback

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setSuccessMessage(null);
        setAnalysisResult(null);
        const file = event.target.files?.[0];
        if (file) {
            if (file.name.endsWith('.xlsx')) {
                setSelectedFile(file);
            } else {
                setError('Invalid file type. Please select an .xlsx file.');
                setSelectedFile(null);
                event.target.value = '';
            }
        } else {
            setSelectedFile(null);
        }
    };

    const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setSuccessMessage(null);
        setAnalysisResult(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setUploadProgress(50); // Simulate progress

            const response = await fetch('/api/crime-reports/import', {
                method: 'POST',
                body: formData,
            });

            setUploadProgress(100); // Simulate completion

            const resultData = await response.json();

            if (!response.ok) {
                throw new Error(resultData.message || `HTTP error! status: ${response.status}`);
            }

            setAnalysisResult(resultData as ImportAnalysisResult);
            console.log("Analysis Result:", resultData);

        } catch (err: any) {
            console.error("Upload/Analysis Error:", err);
            setError(err.message || 'An unknown error occurred during upload or analysis.');
            setAnalysisResult(null);
        } finally {
            setIsAnalyzing(false);
            setUploadProgress(0);
        }
    };

    // --- Handler for Confirmation Step ---
    const handleConfirmImport = async (action: 'import_new_only' | 'import_and_update') => {
        if (!analysisResult) {
            setError("Analysis results are not available.");
            return;
        }

        setIsConfirming(true);
        setError(null);
        setSuccessMessage(null);

        const payload = {
            action,
            validNewReports: analysisResult.validNewReports,
            potentialUpdates: analysisResult.potentialUpdates,
        };

        try {
            const response = await fetch('/api/crime-reports/import/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const resultData: ConfirmationResponse | { message: string } = await response.json();

            if (!response.ok) {
                throw new Error(resultData.message || `HTTP error! status: ${response.status}`);
            }

            // Handle success
            const successData = resultData as ConfirmationResponse;
            let message = successData.message || 'Import completed.';
            if (successData.created > 0) message += ` ${successData.created} new reports created.`;
            if (successData.updated > 0) message += ` ${successData.updated} reports updated.`;
            if (successData.skippedErrors && successData.skippedErrors.length > 0) {
                 message += ` ${successData.skippedErrors.length} rows skipped due to errors during confirmation (see console).`;
                 console.warn("Skipped errors during confirmation:", successData.skippedErrors);
            }
            setSuccessMessage(message);
            // Reset state after successful import
            setAnalysisResult(null);
            setSelectedFile(null);
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';


        } catch (err: any) {
            console.error("Import Confirmation Error:", err);
            setError(err.message || 'An unknown error occurred during import confirmation.');
            // Keep analysisResult so user can see context, maybe retry? Or clear it? User choice.
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setAnalysisResult(null);
        setError(null);
        setSuccessMessage(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };
    // --- End Confirmation Handlers ---


    return (
        <div className="bg-gray-50 p-8 font-sans min-h-screen">
            {/* Header */}
            <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Import Crime Reports</h1>
                    <p className="text-sm text-gray-500">Upload an Excel file (.xlsx) to analyze and import crime data.</p>
                </div>
                {/* Optional: Link to download template */}
                {/* <a href="/path/to/template.xlsx" download>Download Template</a> */}
            </header>

            {/* Upload Form */}
            <form onSubmit={handleUpload} className="mb-8 p-6 bg-white rounded-lg shadow border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label htmlFor="file-upload" className={`flex-grow w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 text-gray-700 flex items-center justify-center sm:justify-start ${isAnalyzing || isConfirming ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer bg-white hover:bg-gray-50'}`}>
                        <FaFileExcel className="mr-3 text-green-600 text-xl" />
                        <span className="text-sm font-medium">
                            {selectedFile ? selectedFile.name : 'Choose .xlsx file...'}
                        </span>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isAnalyzing || isConfirming} // Disable while any operation is running
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!selectedFile || isAnalyzing || isConfirming} // Disable if no file or during operations
                        isLoading={isAnalyzing} // Show spinner only during analysis
                        className="w-full sm:w-auto"
                    >
                        <FaUpload className="mr-2" />
                        {isAnalyzing ? 'Analyzing...' : 'Analyze File'}
                    </Button>
                </div>
                {/* Optional Progress Bar */}
                {isAnalyzing && uploadProgress > 0 && (
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}
            </form>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center gap-3">
                    <FaExclamationTriangle className="text-xl flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Success Display */}
            {successMessage && (
                 <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-center gap-3">
                    <FaCheckCircle className="text-xl flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Success</p>
                        <p>{successMessage}</p>
                    </div>
                     <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-700 hover:text-green-900">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Analysis Results */}
            {analysisResult && !isAnalyzing && !isConfirming && ( // Show only when not loading
                <div className="space-y-6 p-6 bg-white rounded-lg shadow border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Analysis Complete: <span className='font-normal'>{analysisResult.fileName}</span> ({analysisResult.totalRows} rows processed)</h2>

                    {/* Summary Counts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-2xl font-bold text-green-700">{analysisResult.validNewReports.length}</p>
                            <p className="text-sm font-medium text-green-600">New Reports Ready</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-2xl font-bold text-blue-700">{analysisResult.potentialUpdates.length}</p>
                            <p className="text-sm font-medium text-blue-600">Potential Updates (Existing CrimeID)</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-2xl font-bold text-yellow-700">{analysisResult.validationErrors.length}</p>
                            <p className="text-sm font-medium text-yellow-600">Rows with Errors (New)</p>
                        </div>
                         <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <p className="text-2xl font-bold text-orange-700">{analysisResult.duplicateValidationErrors.length}</p>
                            <p className="text-sm font-medium text-orange-600">Rows with Errors (Duplicates)</p>
                        </div>
                    </div>

                    {/* Validation Errors Table */}
                    {(analysisResult.validationErrors.length > 0 || analysisResult.duplicateValidationErrors.length > 0) && (
                        <div>
                            <h3 className="text-lg font-semibold text-red-700 mb-2">Validation Errors</h3>
                            <div className="overflow-x-auto border border-gray-200 rounded-md max-h-60">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Row</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Field</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Error Message</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-700">
                                        {analysisResult.validationErrors.map((err, index) => (
                                            <tr key={`err-new-${index}`} className="bg-yellow-50 hover:bg-yellow-100">
                                                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{err.row}</td>
                                                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{err.field}</td>
                                                <td className="px-4 py-2 text-gray-800">{err.message}</td>
                                                <td className="px-4 py-2 text-gray-800 truncate max-w-xs">{String(err.value ?? 'N/A')}</td>
                                            </tr>
                                        ))}
                                         {analysisResult.duplicateValidationErrors.map((err, index) => (
                                            <tr key={`err-dup-${index}`} className="bg-orange-50 hover:bg-orange-100">
                                                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{err.row}</td>
                                                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{err.field}</td>
                                                <td className="px-4 py-2 text-gray-800">{err.message}</td>
                                                <td className="px-4 py-2 text-gray-800 truncate max-w-xs">{String(err.value ?? 'N/A')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Potential Updates Table */}
                    {analysisResult.potentialUpdates.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-blue-700 mb-2">Potential Updates (Existing Crime IDs Found)</h3>
                            <p className="text-xs text-gray-600 mb-2">These rows have Crime IDs that already exist in the database. If you choose "Import & Update", the existing records will be updated with the data from these rows.</p>
                            <div className="overflow-x-auto border border-gray-200 rounded-md max-h-60">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Row</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Crime ID</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Crime Type</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Location (Barangay)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {analysisResult.potentialUpdates.map((update, index) => (
                                            <tr key={`update-${index}`} className="hover:bg-blue-50">
                                                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{update.row}</td>
                                                <td className="px-4 py-2 text-gray-800 whitespace-nowrap font-mono">{update.crime_id}</td>
                                                {/* Ensure date is handled correctly if it's a string */}
                                                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{new Date(update.date).toLocaleDateString('en-CA')}</td>
                                                <td className="px-4 py-2 text-gray-800">{update.excelData.CrimeType}</td>
                                                <td className="px-4 py-2 text-gray-800">{update.excelData.Barangay}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                     {/* Confirmation Actions */}
                     {(analysisResult.validNewReports.length > 0 || analysisResult.potentialUpdates.length > 0) && (
                        <div className="pt-6 border-t mt-6 flex flex-col sm:flex-row justify-end gap-3">
                            <Button variant="back" onClick={handleCancel} disabled={isConfirming}>
                                <FaTimes className="mr-2"/> Cancel Import
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleConfirmImport('import_new_only')}
                                disabled={analysisResult.validNewReports.length === 0 || isConfirming}
                                isLoading={isConfirming && analysisResult.validNewReports.length > 0} // Show loading on this button if it's the action chosen
                                title={analysisResult.validNewReports.length === 0 ? "No valid new reports to import" : "Import only new reports, skip duplicates"}
                            >
                                <FaCheckCircle className="mr-2"/> Import New Only ({analysisResult.validNewReports.length})
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleConfirmImport('import_and_update')}
                                disabled={isConfirming} // Disable both buttons during confirmation
                                isLoading={isConfirming} // Show loading on this button if confirming
                                title="Import new reports and update existing ones"
                            >
                                <FaSyncAlt className="mr-2"/> Import New ({analysisResult.validNewReports.length}) & Update Duplicates ({analysisResult.potentialUpdates.length})
                            </Button>
                        </div>
                     )}
                     {/* Message if only errors were found */}
                     {analysisResult.validNewReports.length === 0 && analysisResult.potentialUpdates.length === 0 && (analysisResult.validationErrors.length > 0 || analysisResult.duplicateValidationErrors.length > 0) && (
                         <div className="pt-6 border-t mt-6 text-center text-gray-900">
                             No valid reports found to import or update. Please correct the errors in the Excel file and try again.
                             <div className="mt-4">
                                <Button variant="back" onClick={handleCancel}>
                                    <FaTimes className="mr-2"/> Close Analysis
                                </Button>
                             </div>
                         </div>
                     )}

                </div>
            )}

            {/* Show loading spinner during confirmation */}
            {isConfirming && (
                 <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
                        <p className="text-lg font-medium text-gray-700">Processing import...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
