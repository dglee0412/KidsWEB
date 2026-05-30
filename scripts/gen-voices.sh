#!/usr/bin/env bash
# KidsWeb — 장소 음성 mp3 일괄 생성 (Azure AI Speech REST TTS, bash/curl 버전)
# 사용법 (bash):
#   export SPEECH_KEY="여기에-Key1-붙여넣기"
#   export SPEECH_REGION="koreacentral"     # 리소스의 Location/Region (소문자 한 단어)
#   bash scripts/gen-voices.sh
#
# 결과: public/voices/place-<catId>.mp3 10개 + tool-<toolId>.mp3 6개 생성.
set -euo pipefail

: "${SPEECH_KEY:?환경변수 SPEECH_KEY 를 먼저 설정하세요}"
: "${SPEECH_REGION:?환경변수 SPEECH_REGION 를 먼저 설정하세요}"

VOICE="ko-KR-SunHiNeural"   # 더 어린 톤: ko-KR-JiMinNeural / ko-KR-YuJinNeural 로 교체 가능
PITCH="+15%"                # 아이 느낌으로 약간 높게
RATE="-2%"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTDIR="$DIR/public/voices"
mkdir -p "$OUTDIR"

ENDPOINT="https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"

# 키|문구  (좌측 키 = 출력 파일명, app 의 PLACE_VOICE_TEXT / TOOL_VOICE_TEXT 와 동일)
clips=(
  "place-color|색칠 언덕으로 가자!"
  "place-shape|모양 꽃밭으로 가자!"
  "place-music|노래 폭포로 가자!"
  "place-hangul|글자나무 숲으로 가자!"
  "place-english|에이비씨 모래사장으로 가자!"
  "place-math|숫자 산으로 가자!"
  "place-code|로봇 공장으로 가자!"
  "place-brain|수수께끼 동굴로 가자!"
  "place-computer|반짝 등대로 가자!"
  "place-social|친구 광장으로 가자!"
  "tool-crayon|크레용!"
  "tool-brush|붓!"
  "tool-marker|마커!"
  "tool-pencil|연필!"
  "tool-eraser|지우개!"
  "tool-sticker|스티커!"
)

for entry in "${clips[@]}"; do
  id="${entry%%|*}"
  text="${entry#*|}"
  ssml="<speak version='1.0' xml:lang='ko-KR'><voice name='${VOICE}'><prosody pitch='${PITCH}' rate='${RATE}'>${text}</prosody></voice></speak>"
  echo "생성 중: ${id}.mp3  (${text})"
  curl -sS -X POST "$ENDPOINT" \
    -H "Ocp-Apim-Subscription-Key: ${SPEECH_KEY}" \
    -H "Content-Type: application/ssml+xml" \
    -H "X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3" \
    -H "User-Agent: kidsweb-gen-voices" \
    --data-raw "$ssml" \
    --output "$OUTDIR/${id}.mp3"
done

echo ""
echo "완료! $OUTDIR 에 mp3 16개(장소 10 + 도구 6)를 생성했습니다."
