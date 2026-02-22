#!/bin/bash
# Render 빌드 스크립트

# 1. pip 업그레이드 후 Python 패키지 설치
pip install --upgrade pip
pip install -r requirements.txt

# 2. 한글 폰트 다운로드 (PDF 생성용)
mkdir -p fonts
if [ ! -f fonts/NanumGothic-Regular.ttf ]; then
    echo "한글 폰트 다운로드 중..."
    curl -L -o fonts/NanumGothic-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Regular.ttf"
    echo "폰트 다운로드 완료!"
fi
