import { useEffect, useState } from 'react';
import handlersApi from '../api/handlers';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** datalist 요소의 id (페이지 내 고유) */
  listId?: string;
}

// 모듈 단위 캐시 — 한 번만 fetch
let cachedHandlers: string[] | null = null;
let inflight: Promise<string[]> | null = null;

async function getHandlers(): Promise<string[]> {
  if (cachedHandlers) return cachedHandlers;
  if (inflight) return inflight;
  inflight = handlersApi.list().then((list) => {
    cachedHandlers = list;
    inflight = null;
    return list;
  }).catch(() => {
    inflight = null;
    return [];
  });
  return inflight;
}

/** 외부에서 새 담당자 추가 시 캐시 무효화 */
export function invalidateHandlerCache() {
  cachedHandlers = null;
}

export default function HandlerInput({
  value,
  onChange,
  placeholder = '담당자 (예: 이아연)',
  className = '',
  listId = 'handler-options',
}: Props) {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    getHandlers().then(setOptions);
  }, []);

  return (
    <>
      <input
        type="text"
        list={listId}
        className={className || 'form-input'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {options.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}
