module ConvilDesign
  module EstimateExporter
    class AreaCalculator
      # SketchUp 내부 단위는 인치
      # 1 제곱인치 = 0.00064516 제곱미터
      SQ_INCH_TO_SQ_METER = 0.00064516

      def self.face_area_sqm(face)
        area_sq_inches = face.area
        (area_sq_inches * SQ_INCH_TO_SQ_METER).round(4)
      end

      def self.face_dimensions(face)
        bb = face.bounds
        # 인치 → 미터 변환
        w = bb.width.to_f * 0.0254
        h = bb.height.to_f * 0.0254
        d = bb.depth.to_f * 0.0254
        {
          width: [w, d].max.round(3),
          height: h.round(3)
        }
      end
    end
  end
end
