module ConvilDesign
  module EstimateExporter

    require File.join(PLUGIN_DIR, 'convil_estimate_exporter', 'face_analyzer.rb')
    require File.join(PLUGIN_DIR, 'convil_estimate_exporter', 'area_calculator.rb')
    require File.join(PLUGIN_DIR, 'convil_estimate_exporter', 'exporter.rb')
    require File.join(PLUGIN_DIR, 'convil_estimate_exporter', 'json_builder.rb')

    unless file_loaded?(__FILE__)
      menu = UI.menu('Plugins')
      submenu = menu.add_submenu('Convil Design')

      submenu.add_item('견적 데이터 추출') { self.run_export }

      file_loaded(__FILE__)
    end

    def self.run_export
      model = Sketchup.active_model
      unless model
        UI.messagebox('열린 모델이 없습니다.')
        return
      end

      # 파일 저장 대화상자
      default_name = begin
        File.basename(model.path, '.*')
      rescue
        'untitled'
      end
      default_name = 'untitled' if default_name.empty?

      path = UI.savepanel(
        '견적 데이터 저장',
        '',
        "#{default_name}_estimate.json"
      )
      return unless path

      # 확장자 추가
      path += '.json' unless path.end_with?('.json')

      begin
        exporter = Exporter.new(model)
        json_data = exporter.export

        File.open(path, 'w:UTF-8') { |f| f.write(json_data) }

        UI.messagebox(
          "견적 데이터가 저장되었습니다!\n\n" \
          "파일: #{path}\n\n" \
          "이 파일을 컨빌디자인 견적 시스템 웹사이트에 업로드하세요."
        )
      rescue => e
        UI.messagebox("오류가 발생했습니다:\n#{e.message}")
      end
    end

  end
end
