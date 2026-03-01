module ConvilDesign
  module EstimateExporter
    class FaceAnalyzer
      # 법선 벡터 Z 성분 임계값
      # Z > 0.7 → 바닥, Z < -0.7 → 천장, 그 외 → 벽
      VERTICAL_THRESHOLD = 0.7

      def self.surface_type(face)
        normal = face.normal
        if normal.z > VERTICAL_THRESHOLD
          'floor'
        elsif normal.z < -VERTICAL_THRESHOLD
          'ceiling'
        else
          'wall'
        end
      end

      def self.material_name(face)
        # 앞면 재질 우선
        mat = face.material
        return mat.display_name if mat

        # 뒷면 재질 확인 (뒤집힌 면)
        back_mat = face.back_material
        return back_mat.display_name if back_mat

        '미지정'
      end
    end
  end
end
