import { useState, useEffect, useCallback } from 'react';
import materialsApi from '../api/materials';
import MaterialTable from '../components/materials/MaterialTable';
import MaterialForm from '../components/materials/MaterialForm';
import type { Material, MaterialCreate, DbStats } from '../types/material';

const LEVEL1_TABS = ['전체', '바닥', '벽체', '벽/바닥', '부자재'];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level1, setLevel1] = useState('전체');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Material | null>(null);
  const [stats, setStats] = useState<DbStats | null>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await materialsApi.list({
        level1: level1 === '전체' ? undefined : level1,
        search: search || undefined,
        limit: 500,
      });
      setMaterials(res.materials);
      setTotal(res.total);
    } catch (err) {
      console.error('자재 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [level1, search]);

  useEffect(() => {
    fetchMaterials();
    materialsApi.getStats().then(setStats).catch(() => {});
  }, [fetchMaterials]);

  const handleSave = async (data: MaterialCreate) => {
    try {
      if (editTarget) {
        await materialsApi.update(editTarget.id, data);
      } else {
        await materialsApi.create(data);
      }
      setShowForm(false);
      setEditTarget(null);
      fetchMaterials();
    } catch (err: any) {
      alert(err.response?.data?.detail || '저장에 실패했습니다.');
    }
  };

  const handleEdit = (material: Material) => {
    setEditTarget(material);
    setShowForm(true);
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`'${material.product_name}' 자재를 삭제하시겠습니까?`)) return;
    try {
      await materialsApi.delete(material.id);
      fetchMaterials();
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleAdd = () => {
    setEditTarget(null);
    setShowForm(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">자재 데이터베이스</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              마감재 {total}개
              {stats && (
                <span>
                  {' '} / 브랜드 {stats.brands}개 / 인건비 {stats.labor_rates}개 / 기타품목 {stats.misc_items}개
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              자재 추가
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {LEVEL1_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setLevel1(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  level1 === tab
                    ? 'bg-[#2E75B6] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-xs ml-auto">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="form-input pl-9"
                placeholder="제품명, 코드, 규격 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-4">
        <div className="section-card p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-[#2E75B6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              로딩 중...
            </div>
          ) : (
            <MaterialTable
              materials={materials}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <MaterialForm
          material={editTarget}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
