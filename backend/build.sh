#!/bin/bash
# Render 빌드 스크립트

# 1. Python 패키지 설치
pip install -r requirements.txt

# 2. 한글 폰트 다운로드 (PDF 생성용)
mkdir -p fonts
if [ ! -f fonts/NanumGothic-Regular.ttf ]; then
    echo "한글 폰트 다운로드 중..."
    curl -L -o /tmp/NanumGothic.zip "https://fonts.google.com/download?family=Nanum+Gothic"
    unzip -o /tmp/NanumGothic.zip -d /tmp/NanumGothic
    cp /tmp/NanumGothic/NanumGothic-Regular.ttf fonts/NanumGothic-Regular.ttf
    rm -rf /tmp/NanumGothic /tmp/NanumGothic.zip
    echo "폰트 다운로드 완료!"
fi
