import { useState, useEffect } from 'react';
import type { Material, MaterialCreate } from '../../types/material';

interface Props {
  material?: Material | null;
  onSave: (data: MaterialCreate) => void;
  onClose: () => void;
}

const UNITS = ['m2', 'roll', 'ea', 'm', 'set', '1Box', '18L', '1장'];

export default function MaterialForm({ material, onSave, onClose }: Props) {
  const [form, setForm] = useState<MaterialCreate>({
    product_name: '',
    brand_name: '',
    category_level1: '',
    category_level2: '',
    category_level3: '',
    unit: 'm2',
    unit_price: 0,
    spec: '',
    loss_rate: 10,
    note: '',
  });

  useEffect(() => {
    if (material) {
      setForm({
        product_name: material.product_name,
        product_code: material.product_code,
        brand_name: material.brand_name,
        category_level1: material.category_level1,
        category_level2: material.category_level2,
        category_level3: material.category_level3,
        unit: material.unit,
        unit_price: material.unit_price,
        spec: material.spec,
        loss_rate: material.loss_rate,
        note: material.note,
      });
    }
  }, [material]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name?.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {material ? '자재 수정' : '자재 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">제품명 *</label>
            <input
              className="form-input"
              value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              placeholder="예: 숲으로 에이스"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">브랜드</label>
              <input
                className="form-input"
                value={form.brand_name || ''}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                placeholder="예: LX하우시스"
              />
            </div>
            <div>
              <label className="form-label">제품 코드</label>
              <input
                className="form-input"
                value={form.product_code || ''}
                onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                placeholder="예: PTT6910"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">대분류</label>
              <input
                className="form-input"
                value={form.category_level1 || ''}
                onChange={(e) => setForm({ ...form, category_level1: e.target.value })}
                placeholder="바닥"
              />
            </div>
            <div>
              <label className="form-label">중분류</label>
              <input
                className="form-input"
                value={form.category_level2 || ''}
                onChange={(e) => setForm({ ...form, category_level2: e.target.value })}
                placeholder="데코타일"
              />
            </div>
            <div>
              <label className="form-label">상세분류</label>
              <input
                className="form-input"
                value={form.category_level3 || ''}
                onChange={(e) => setForm({ ...form, category_level3: e.target.value })}
                placeholder="프레스티지"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">단가 (원)</label>
              <input
                type="number"
                className="form-input"
                value={form.unit_price || 0}
                onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
                min={0}
              />
            </div>
            <div>
              <label className="form-label">단위</label>
              <select
                className="form-select"
                value={form.unit || 'm2'}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">로스율 (%)</label>
              <input
                type="number"
                className="form-input"
                value={form.loss_rate || 10}
                onChange={(e) => setForm({ ...form, loss_rate: Number(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="form-label">규격</label>
            <input
              className="form-input"
              value={form.spec || ''}
              onChange={(e) => setForm({ ...form, spec: e.target.value })}
              placeholder="예: 3T/600*600"
            />
          </div>

          <div>
            <label className="form-label">비고</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.note || ''}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center">
              {material ? '수정' : '추가'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
