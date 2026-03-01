require 'json'

module ConvilDesign
  module EstimateExporter
    class JsonBuilder
      def self.build(project_name:, sketchup_version:, rooms:, materials:)
        total_wall = 0.0
        total_floor = 0.0
        total_ceiling = 0.0

        rooms_array = rooms.map do |name, data|
          data[:surfaces].each do |s|
            s[:area_sqm] = s[:area_sqm].round(2)
            case s[:type]
            when 'wall'    then total_wall += s[:area_sqm]
            when 'floor'   then total_floor += s[:area_sqm]
            when 'ceiling' then total_ceiling += s[:area_sqm]
            end
          end
          { name: name, surfaces: data[:surfaces] }
        end

        materials_array = materials.map do |name, data|
          {
            name: name,
            textureFile: data[:textureFile] || '',
            totalArea_sqm: data[:totalArea_sqm].round(2)
          }
        end

        result = {
          projectName: project_name,
          exportDate: Time.now.strftime('%Y-%m-%d'),
          sketchupVersion: sketchup_version,
          units: 'millimeters',
          rooms: rooms_array,
          totalArea: {
            wall: total_wall.round(2),
            floor: total_floor.round(2),
            ceiling: total_ceiling.round(2)
          },
          materials: materials_array
        }

        JSON.pretty_generate(result)
      end
    end
  end
end
