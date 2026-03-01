module ConvilDesign
  module EstimateExporter
    class Exporter
      def initialize(model)
        @model = model
        @rooms = {}
        @materials = {}
      end

      def export
        # 모든 엔티티 순회
        traverse_entities(@model.active_entities, nil)

        JsonBuilder.build(
          project_name: project_name,
          sketchup_version: Sketchup.version,
          rooms: @rooms,
          materials: @materials
        )
      end

      private

      def project_name
        name = begin
          File.basename(@model.path, '.*')
        rescue
          ''
        end
        name.empty? ? '미정' : name
      end

      def traverse_entities(entities, room_name)
        entities.each do |entity|
          case entity
          when Sketchup::Group
            name = entity.name.empty? ? "그룹_#{entity.entityID}" : entity.name
            traverse_entities(entity.entities, name)
          when Sketchup::ComponentInstance
            name = entity.name.empty? ? entity.definition.name : entity.name
            traverse_entities(entity.definition.entities, name)
          when Sketchup::Face
            process_face(entity, room_name || '미분류')
          end
        end
      end

      def process_face(face, room_name)
        surface_type = FaceAnalyzer.surface_type(face)
        material_name = FaceAnalyzer.material_name(face)
        area = AreaCalculator.face_area_sqm(face)
        dims = AreaCalculator.face_dimensions(face)

        @rooms[room_name] ||= { surfaces: [] }

        # 같은 방의 같은 type+material이면 합산
        existing = @rooms[room_name][:surfaces].find { |s|
          s[:type] == surface_type && s[:materialName] == material_name
        }

        if existing
          existing[:area_sqm] += area
          existing[:faceCount] += 1
        else
          @rooms[room_name][:surfaces] << {
            type: surface_type,
            area_sqm: area,
            materialName: material_name,
            width: dims[:width],
            height: dims[:height],
            faceCount: 1
          }
        end

        # 재질별 전체 면적 추적
        @materials[material_name] ||= { totalArea_sqm: 0.0 }
        @materials[material_name][:totalArea_sqm] += area

        # 텍스처 파일명 기록
        mat = face.material
        if mat && mat.texture
          @materials[material_name][:textureFile] = mat.texture.filename
        end
      end
    end
  end
end
