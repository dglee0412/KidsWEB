# KidsWeb - generate place-name voice mp3s (Azure AI Speech REST TTS, PowerShell)
# Korean text is read from scripts/voices.json (UTF-8) so Windows PowerShell 5.1
# (which mis-reads BOM-less UTF-8 .ps1 as CP949) does NOT corrupt the text.
#
# Usage (PowerShell):
#   $env:SPEECH_KEY    = "<paste-Key1-here>"
#   $env:SPEECH_REGION = "koreacentral"
#   powershell -ExecutionPolicy Bypass -File scripts\gen-voices.ps1
#
# Output: public\voices\place-<catId>.mp3 (10) + tool-<toolId>.mp3 (6)

$ErrorActionPreference = 'Stop'

$Key    = $env:SPEECH_KEY
$Region = $env:SPEECH_REGION
if ([string]::IsNullOrWhiteSpace($Key) -or [string]::IsNullOrWhiteSpace($Region)) {
  Write-Error "Set env vars SPEECH_KEY and SPEECH_REGION first."
}

# For a younger tone, try ko-KR-JiMinNeural or ko-KR-YuJinNeural
$Voice = 'ko-KR-SunHiNeural'
$Pitch = '+15%'
$Rate  = '-2%'

# Read phrases explicitly as UTF-8 (encoding-safe)
$places = (Get-Content -Raw -Encoding UTF8 -Path (Join-Path $PSScriptRoot 'voices.json')) | ConvertFrom-Json
$tools  = (Get-Content -Raw -Encoding UTF8 -Path (Join-Path $PSScriptRoot 'tools.json'))  | ConvertFrom-Json

$OutDir = Join-Path $PSScriptRoot '..\public\voices'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$endpoint = "https://$Region.tts.speech.microsoft.com/cognitiveservices/v1"
$headers = @{
  'Ocp-Apim-Subscription-Key' = $Key
  'Content-Type'              = 'application/ssml+xml'
  'X-Microsoft-OutputFormat'  = 'audio-24khz-48kbitrate-mono-mp3'
  'User-Agent'                = 'kidsweb-gen-voices'
}

function Invoke-Gen($prefix, $obj) {
  foreach ($p in $obj.PSObject.Properties) {
    $ssml = "<speak version='1.0' xml:lang='ko-KR'><voice name='$Voice'><prosody pitch='$Pitch' rate='$Rate'>$($p.Value)</prosody></voice></speak>"
    $outFile = Join-Path $OutDir ("{0}-{1}.mp3" -f $prefix, $p.Name)
    Write-Host ("generating: {0}-{1}.mp3" -f $prefix, $p.Name)
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($ssml)
    Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $bodyBytes -OutFile $outFile
  }
}

Invoke-Gen 'place' $places
Invoke-Gen 'tool'  $tools

Write-Host "`nDone. Generated place-*.mp3 (10) + tool-*.mp3 (6) in $OutDir" -ForegroundColor Green
