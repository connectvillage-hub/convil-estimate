import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const WEBHOOK_URL = 'https://convil-estimate.onrender.com/api/customers/intake';

const APPS_SCRIPT_CODE = `// ========= 컨빌 디자인 - 구글 폼 → CRM 자동 등록 =========
// 1) 이 코드를 구글 폼의 '확장 프로그램 → Apps Script' 에 붙여넣기
// 2) WEBHOOK_TOKEN 값을 Render 에 설정한 토큰으로 변경 (없으면 빈 문자열로 두기)
// 3) FIELD_MAP 의 키를 본인 폼의 질문 제목과 일치시키기
// 4) 저장 후 좌측 시계 아이콘(트리거) → '+' → 함수 onFormSubmit, 이벤트: 폼 제출 시

const WEBHOOK_URL = '${WEBHOOK_URL}';
const WEBHOOK_TOKEN = ''; // ⚠️ Render Environment 의 WEBHOOK_TOKEN 값과 동일하게 (선택)

// 본인 구글 폼 질문 제목 → 시스템 필드 매핑
const FIELD_MAP = {
  name:          ['이름', '성함', '고객명'],
  phone:         ['연락처', '전화번호', '핸드폰'],
  email:         ['이메일', '메일'],
  companyName:   ['회사명', '상호'],
  address:       ['주소'],
  inquirySource: ['문의 경로', '경로'],   // 인스타그램/유튜브 등
  memo:          ['문의 내용', '내용', '메시지'],
};

// 한국어 라벨 → 시스템 enum 변환 (선택)
const SOURCE_TO_ENUM = {
  '인스타그램': 'instagram', '유튜브': 'youtube', '블로그': 'blog',
  '네이버': 'naver', '네이버 검색': 'naver',
  '지인 추천': 'referral', '지인추천': 'referral',
  'AI 검색': 'ai', 'AI검색': 'ai',
  '문자 광고': 'sms', '외주 사이트': 'outsourcing',
  '홈페이지': 'website', '당근': 'danggn', '메일 광고': 'email',
};

function onFormSubmit(e) {
  // 1) 폼 응답을 { 질문제목: 답 } 객체로 변환
  const responses = e.response.getItemResponses();
  const raw = {};
  responses.forEach(function(r) {
    raw[r.getItem().getTitle()] = r.getResponse();
  });

  // 2) FIELD_MAP 으로 시스템 필드 추출
  function pick(keys) {
    for (var i = 0; i < keys.length; i++) {
      if (raw[keys[i]] != null && raw[keys[i]] !== '') return raw[keys[i]];
    }
    return '';
  }

  var sourceLabel = pick(FIELD_MAP.inquirySource);
  var inquirySource = SOURCE_TO_ENUM[sourceLabel] || 'website';

  var payload = {
    name:          pick(FIELD_MAP.name) || '(이름 없음)',
    phone:         pick(FIELD_MAP.phone),
    email:         pick(FIELD_MAP.email),
    companyName:   pick(FIELD_MAP.companyName),
    address:       pick(FIELD_MAP.address),
    inquirySource: inquirySource,
    memo:          pick(FIELD_MAP.memo),
    rawData:       raw,
  };

  var headers = { 'Content-Type': 'application/json' };
  if (WEBHOOK_TOKEN) headers['X-Webhook-Token'] = WEBHOOK_TOKEN;

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}`;

export default function GoogleFormGuideModal({ open, onClose }: Props) {
  const [copied, setCopied] = useState<'url' | 'code' | null>(null);

  if (!open) return null;

  const copy = async (text: string, kind: 'url' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error(err);
      alert('복사 실패. 직접 선택해서 복사해주세요.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            🔗 구글 폼 → 고객 자동 등록 연동 가이드
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
            구글 폼이 제출되면 <strong>자동으로 고객 등록</strong>되고, 폼 응답이 1차 컨택 기록으로 저장됩니다. 한 번만 세팅하면 끝입니다.
          </div>

          {/* Step 1 */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              1단계 · 구글 폼에서 Apps Script 열기
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside ml-2">
              <li>본인 구글 폼 편집 화면 열기</li>
              <li>우측 상단 <strong>⋮ (점 3개)</strong> → <strong>스크립트 편집기</strong> 클릭</li>
              <li>(또는 <strong>확장 프로그램 → Apps Script</strong>)</li>
            </ol>
          </section>

          {/* Step 2 */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              2단계 · 아래 코드를 통째로 붙여넣기
            </h3>
            <div className="relative">
              <button
                onClick={() => copy(APPS_SCRIPT_CODE, 'code')}
                className="absolute top-2 right-2 z-10 text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 shadow"
              >
                {copied === 'code' ? '✓ 복사됨' : '📋 복사'}
              </button>
              <pre className="bg-gray-900 text-gray-100 text-[11px] p-3 rounded-lg overflow-auto max-h-64 font-mono leading-relaxed">
{APPS_SCRIPT_CODE}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              💡 <strong>FIELD_MAP</strong> 부분의 한국어 키를 본인 구글 폼 질문 제목과 일치시키세요.
            </p>
          </section>

          {/* Step 3 */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              3단계 · 트리거 등록 (가장 중요)
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside ml-2">
              <li>Apps Script 좌측 <strong>⏰ 시계 아이콘 (트리거)</strong> 클릭</li>
              <li>우측 하단 <strong>+ 트리거 추가</strong></li>
              <li>설정:
                <ul className="ml-6 mt-1 space-y-0.5 text-xs">
                  <li>· 실행할 함수: <code className="bg-gray-100 px-1 rounded">onFormSubmit</code></li>
                  <li>· 이벤트 소스: <strong>스프레드시트에서</strong> → 잠깐, 폼이면 <strong>설문지에서</strong></li>
                  <li>· 이벤트 유형: <strong>설문지 제출 시</strong></li>
                </ul>
              </li>
              <li><strong>저장</strong> → 구글 권한 요청 시 본인 계정으로 승인</li>
            </ol>
          </section>

          {/* Step 4 */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              4단계 · (선택) 보안 토큰 설정
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              아무나 이 웹훅 URL 을 알면 가짜 고객을 등록할 수 있습니다. 막으려면:
            </p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside ml-2">
              <li>아무 문자열(예: <code className="bg-gray-100 px-1 rounded">my-secret-2026</code>) 정하기</li>
              <li>Render 대시보드 → <strong>convil-estimate → Environment</strong> →
                <code className="bg-gray-100 px-1 rounded mx-1">WEBHOOK_TOKEN</code> 으로 추가
              </li>
              <li>위 Apps Script 코드의 <code className="bg-gray-100 px-1 rounded">WEBHOOK_TOKEN</code> 값을 같은 문자열로 변경</li>
              <li>Render 가 자동 재배포됨 (3~5분)</li>
            </ol>
          </section>

          {/* Webhook URL */}
          <section className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-medium text-gray-500 mb-1">Webhook URL (참고용)</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1.5 font-mono break-all">
                {WEBHOOK_URL}
              </code>
              <button
                onClick={() => copy(WEBHOOK_URL, 'url')}
                className="text-xs bg-white border border-gray-300 rounded px-2 py-1.5 hover:bg-gray-100"
              >
                {copied === 'url' ? '✓' : '📋'}
              </button>
            </div>
          </section>

          {/* 테스트 안내 */}
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h3 className="text-sm font-bold text-amber-900 mb-1">✅ 테스트</h3>
            <p className="text-xs text-amber-800">
              세팅 끝나면 본인 구글 폼을 테스트로 제출해보고 <strong>고객 목록</strong>에 새 고객이 추가되는지 확인하세요. 잘 안 되면 Apps Script <strong>실행 (즐겨찾기 옆 ▶)</strong> → 로그 확인.
            </p>
          </section>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
