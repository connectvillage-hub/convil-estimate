import type { Material } from '../../types/material';

interface Props {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('ko-KR');

export default function MaterialTable({ materials, onEdit, onDelete }: Props) {
  if (materials.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-sm">등록된 자재가 없습니다.</p>
        <p className="text-xs mt-1">데이터를 입력하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-3 py-3 font-semibold text-gray-600">제품명</th>
            <th className="text-left px-3 py-3 font-semibold text-gray-600">브랜드</th>
            <th className="text-left px-3 py-3 font-semibold text-gray-600">분류</th>
            <th className="text-left px-3 py-3 font-semibold text-gray-600">규격</th>
            <th className="text-right px-3 py-3 font-semibold text-gray-600">단가</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-600">단위</th>
            <th className="text-right px-3 py-3 font-semibold text-gray-600">평당가</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-600">로스율</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-600 w-20">관리</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((mat) => (
            <tr
              key={mat.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-3 py-2.5">
                <div className="font-medium text-gray-800 truncate max-w-[200px]">{mat.product_name}</div>
                {mat.product_code && (
                  <div className="text-xs text-gray-400">{mat.product_code}</div>
                )}
              </td>
              <td className="px-3 py-2.5 text-gray-600 text-xs">{mat.brand_name || '-'}</td>
              <td className="px-3 py-2.5">
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {mat.category_level2 || mat.category_level1 || '-'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-gray-600 text-xs">{mat.spec || '-'}</td>
              <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                {formatCurrency(mat.unit_price)}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{mat.unit}</td>
              <td className="px-3 py-2.5 text-right text-gray-600 text-xs">
                {mat.price_per_py ? `${formatCurrency(mat.price_per_py)}/평` : '-'}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-500 text-xs">
                {mat.loss_rate > 0 ? `${mat.loss_rate}%` : '-'}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit(mat)}
                    className="text-gray-400 hover:text-[#2E75B6] p-1 rounded transition-colors"
                    title="수정"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(mat)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
