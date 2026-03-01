"""
텍스트 데이터를 파싱하여 DB에 입력하는 스크립트
사용법: cd backend && python -m scripts.import_text_data
"""
import sys
import os
import re

# backend 디렉토리를 path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import SessionLocal, engine, Base
from models.material import Brand, Category, Material
from services.material_service import MaterialService
from models.schemas.material import MaterialCreate


def clean_price(price_str: str) -> int:
    """가격 문자열에서 숫자만 추출 (콤마, '원' 제거)"""
    if not price_str:
        return 0
    price_str = price_str.strip()
    if not price_str:
        return 0
    # '원' 제거, 콤마 제거
    cleaned = price_str.replace("원", "").replace(",", "").strip()
    if not cleaned:
        return 0
    try:
        return int(float(cleaned))
    except ValueError:
        return 0


def parse_coverage_area(area_str: str) -> float | None:
    """시공가능면적 문자열에서 숫자 추출
    예: '27', '6.5', '약 1.8평 (2회 도장 기준)', '약 7~8평 (2회 도장 기준)'
    """
    if not area_str:
        return None
    area_str = area_str.strip()
    if not area_str:
        return None

    # 순수 숫자인 경우
    try:
        return float(area_str)
    except ValueError:
        pass

    # "약 X~Y평" 형태 → 중간값 사용
    match = re.search(r"약\s*([\d.]+)\s*~\s*([\d.]+)", area_str)
    if match:
        low, high = float(match.group(1)), float(match.group(2))
        return round((low + high) / 2, 2)

    # "약 X평" 형태
    match = re.search(r"약\s*([\d.]+)", area_str)
    if match:
        return float(match.group(1))

    # 숫자만 추출
    match = re.search(r"([\d.]+)", area_str)
    if match:
        return float(match.group(1))

    return None


def parse_pipe_line(line: str) -> list[str]:
    """파이프 구분 라인을 파싱하여 필드 리스트 반환"""
    return [field.strip() for field in line.split("|")]


def parse_paint_sheet(lines: list[str]) -> list[MaterialCreate]:
    """도장 시트 파싱
    헤더: 브랜드 | 제품명 | 상세분류 | 단위(용량) | 단위당 가격(VAT포함) | 시공가능면적(평) | 평당 자재비(수식) | 구매처/링크
    카테고리: 벽체 > 도장 > (상세분류)
    """
    materials = []
    for line in lines:
        if not line.strip() or line.startswith("---") or line.startswith("브랜드"):
            continue
        if "|" not in line:
            continue

        fields = parse_pipe_line(line)
        if len(fields) < 5:
            continue

        brand = fields[0].strip()
        product_name = fields[1].strip()
        detail_class = fields[2].strip() if len(fields) > 2 else ""
        unit = fields[3].strip() if len(fields) > 3 else ""
        price = clean_price(fields[4]) if len(fields) > 4 else 0
        coverage_area = parse_coverage_area(fields[5]) if len(fields) > 5 else None
        purchase_url = fields[7].strip() if len(fields) > 7 else ""

        if not product_name:
            continue

        # 평당 자재비 자동 계산 (수식 컬럼은 무시, _compute_prices가 자동 처리)
        mat = MaterialCreate(
            brand_name=brand,
            category_level1="벽체",
            category_level2="도장",
            category_level3=detail_class,
            product_name=product_name,
            unit=unit or "18L",
            unit_price=price,
            coverage_area_py=coverage_area,
            loss_rate=5.0,  # 도장 기본 로스율
            purchase_url=purchase_url,
            note="",
        )
        materials.append(mat)

    return materials


def parse_bathroom_tile_sheet(lines: list[str]) -> list[MaterialCreate]:
    """화장실 타일 시트 파싱
    헤더: 브랜드 | 제품명 | 상세분류 | 사이즈 | 단위당 가격(VAT포함) | 시공가능면적(평) | 평당 자재비(수식) | 구매처/링크
    카테고리: 벽/바닥 > 화장실타일
    """
    materials = []
    for line in lines:
        if not line.strip() or line.startswith("---") or line.startswith("브랜드"):
            continue
        if "|" not in line:
            continue

        fields = parse_pipe_line(line)
        if len(fields) < 5:
            continue

        brand = fields[0].strip()
        product_name = fields[1].strip()
        detail_class = fields[2].strip() if len(fields) > 2 else ""
        size = fields[3].strip() if len(fields) > 3 else ""
        price = clean_price(fields[4]) if len(fields) > 4 else 0

        if not product_name:
            continue
        if price == 0:
            continue  # 가격 없는 항목 스킵

        mat = MaterialCreate(
            brand_name=brand,
            category_level1="벽/바닥",
            category_level2="화장실타일",
            category_level3=detail_class,
            product_name=product_name,
            product_code=product_name,  # 제품코드가 제품명과 동일
            spec=size,
            unit="ea",
            unit_price=price,
            loss_rate=10.0,  # 타일 기본 로스율
            note="",
        )
        materials.append(mat)

    return materials


def parse_deco_tile_sheet(lines: list[str]) -> list[MaterialCreate]:
    """데코타일 시트 파싱
    헤더: 브랜드 | 제품명 | 상세분류 | 단위(용량) | 단위당 가격(VAT포함) | 사이즈(규격) | 구매처/링크 | 비고
    카테고리: 바닥 > 데코타일 > (상세분류)
    """
    materials = []
    for line in lines:
        if not line.strip() or line.startswith("---") or line.startswith("브랜드"):
            continue
        if "|" not in line:
            continue

        fields = parse_pipe_line(line)
        if len(fields) < 5:
            continue

        brand = fields[0].strip()
        product_name = fields[1].strip()
        detail_class = fields[2].strip() if len(fields) > 2 else ""
        unit = fields[3].strip() if len(fields) > 3 else "1Box"
        price = clean_price(fields[4]) if len(fields) > 4 else 0
        spec = fields[5].strip() if len(fields) > 5 else ""
        purchase_url = fields[6].strip() if len(fields) > 6 else ""
        note = fields[7].strip() if len(fields) > 7 else ""

        if not product_name:
            continue
        if price == 0:
            continue

        # 제품코드 추출: 제품명에서 마지막 영숫자 부분
        product_code = ""
        code_match = re.search(r"([A-Z]{2,3}\w*\d+\w*)\s*$", product_name)
        if code_match:
            product_code = code_match.group(1)

        mat = MaterialCreate(
            brand_name=brand,
            category_level1="바닥",
            category_level2="데코타일",
            category_level3=detail_class,
            product_name=product_name,
            product_code=product_code,
            spec=spec,
            unit=unit if unit else "1Box",
            unit_price=price,
            loss_rate=10.0,  # 데코타일 기본 로스율
            purchase_url=purchase_url,
            note=note,
        )
        materials.append(mat)

    return materials


def split_sheets(text: str) -> dict[str, list[str]]:
    """텍스트를 시트별로 분리"""
    sheets = {}
    current_sheet = None
    current_lines = []

    for line in text.split("\n"):
        stripped = line.strip()

        # 시트 구분선 감지
        if stripped.startswith("시트:"):
            if current_sheet and current_lines:
                sheets[current_sheet] = current_lines
            current_sheet = stripped.replace("시트:", "").strip()
            current_lines = []
            continue

        if stripped.startswith("==="):
            continue

        if current_sheet is not None:
            current_lines.append(line)

    # 마지막 시트
    if current_sheet and current_lines:
        sheets[current_sheet] = current_lines

    return sheets


def main():
    # DB 테이블 생성
    Base.metadata.create_all(bind=engine)

    # 데이터 파일 읽기
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "raw_material_data.txt")
    if not os.path.exists(data_path):
        print(f"데이터 파일을 찾을 수 없습니다: {data_path}")
        sys.exit(1)

    with open(data_path, "r", encoding="utf-8") as f:
        text = f.read()

    # 시트별 분리
    sheets = split_sheets(text)
    print(f"\n발견된 시트: {list(sheets.keys())}")
    for name, lines in sheets.items():
        data_lines = [l for l in lines if "|" in l and not l.strip().startswith("---")]
        print(f"  - {name}: {len(data_lines)}개 데이터 라인")

    # 파싱
    all_materials: list[MaterialCreate] = []

    if "도장" in sheets:
        paint_materials = parse_paint_sheet(sheets["도장"])
        print(f"\n[도장] 파싱 완료: {len(paint_materials)}개")
        all_materials.extend(paint_materials)

    if "화장실 타일" in sheets:
        tile_materials = parse_bathroom_tile_sheet(sheets["화장실 타일"])
        print(f"[화장실 타일] 파싱 완료: {len(tile_materials)}개")
        all_materials.extend(tile_materials)

    if "데코타일" in sheets:
        deco_materials = parse_deco_tile_sheet(sheets["데코타일"])
        print(f"[데코타일] 파싱 완료: {len(deco_materials)}개")
        all_materials.extend(deco_materials)

    print(f"\n총 {len(all_materials)}개 자재 파싱 완료")

    # DB 입력
    db = SessionLocal()
    try:
        svc = MaterialService(db)

        created = 0
        skipped = 0
        errors = []

        for i, mat_data in enumerate(all_materials):
            try:
                # 중복 체크 (같은 제품명 + 같은 단위)
                existing = db.query(Material).filter(
                    Material.product_name == mat_data.product_name,
                    Material.unit == mat_data.unit,
                ).first()
                if existing:
                    skipped += 1
                    continue

                svc.create_material(mat_data)
                created += 1

                if (created + skipped) % 50 == 0:
                    print(f"  진행: {created + skipped}/{len(all_materials)} (입력: {created}, 스킵: {skipped})")

            except Exception as e:
                errors.append(f"[{i}] {mat_data.product_name}: {str(e)}")

        # 최종 통계
        stats = svc.get_stats()
        print(f"\n{'='*60}")
        print(f"입력 완료!")
        print(f"  신규 입력: {created}개")
        print(f"  중복 스킵: {skipped}개")
        print(f"  오류: {len(errors)}개")
        print(f"\nDB 현황:")
        print(f"  자재: {stats['materials']}개")
        print(f"  브랜드: {stats['brands']}개")
        print(f"  카테고리: {stats['categories']}개")
        print(f"{'='*60}")

        if errors:
            print(f"\n오류 목록:")
            for err in errors[:20]:
                print(f"  - {err}")
            if len(errors) > 20:
                print(f"  ... 외 {len(errors)-20}개")

    finally:
        db.close()


if __name__ == "__main__":
    main()
