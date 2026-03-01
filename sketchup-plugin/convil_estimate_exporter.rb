require 'sketchup'
require 'extensions'

module ConvilDesign
  module EstimateExporter
    PLUGIN_DIR = File.dirname(__FILE__)

    ext = SketchupExtension.new(
      'Convil Design Estimate Exporter',
      File.join(PLUGIN_DIR, 'convil_estimate_exporter', 'main.rb')
    )
    ext.version     = '1.0.0'
    ext.description = '스케치업 모델에서 인테리어 견적 데이터를 JSON으로 추출합니다.'
    ext.creator     = 'Convil Design (컨빌디자인)'

    Sketchup.register_extension(ext, true)
  end
end
