import { useState, useRef } from 'react';
import axios from 'axios';

interface ExcelUploadResult {
  created: number;
  updated: number;
  errors: string[];
  total_processed: number;
}

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const getApiBase = () =>
  window.location.hostname === 'localhost' ? '' : 'https://convil-estimate.onrender.com';

export default function MaterialExcelUpload({ onComplete, onClose }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ExcelUploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: res } = await axios.post<ExcelUploadResult>(
        `${getApiBase()}/api/materials/upload-excel`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setResult(res);
      onComplete();
    } catch (err: any) {
      alert(err.response?.data?.detail || '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Excel 자재 업로드</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <div className="p-6">
          {!result ? (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-[#2E75B6] bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={onFileChange}
                />
                {uploading ? (
                  <div className="text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-[#2E75B6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    업로드 중...
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">
                      Excel 파일을 드래그하거나 클릭하여 선택
                    </p>
                    <p className="text-xs text-gray-400 mt-1">.xlsx, .xls 파일</p>
                  </>
                )}
              </div>

              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  엑셀 형식 안내
                </p>
                <p className="text-xs text-gray-500">
                  필수 열: <span className="font-medium text-gray-700">자재명</span>
                </p>
                <p className="text-xs text-gray-500">
                  선택 열: 카테고리, 단위, 단가, 규격, 제조사, 메모, 할증률(%)
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-bold text-gray-800 mb-4">업로드 완료</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{result.created}</p>
                  <p className="text-xs text-green-600">신규 추가</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                  <p className="text-xs text-blue-600">업데이트</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-xs text-red-600">오류</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="text-left bg-red-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">{err}</p>
                  ))}
                </div>
              )}
              <button onClick={onClose} className="btn-primary w-full justify-center">
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
