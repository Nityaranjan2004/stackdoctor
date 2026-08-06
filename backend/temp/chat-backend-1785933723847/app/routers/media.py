from fastapi import APIRouter, UploadFile, File, HTTPException
from deepgram import DeepgramClient
from deep_translator import GoogleTranslator
from app.core.config import settings

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not settings.DEEPGRAM_API_KEY or settings.DEEPGRAM_API_KEY == "your_deepgram_api_key_here":
        # Mock response for testing
        print("Using mock transcription due to missing API Key")
        return {"transcript": "これはテストです。サーバーがダウンしています。"}
    
    try:
        deepgram = DeepgramClient(api_key=settings.DEEPGRAM_API_KEY)
        audio_data = await file.read()
        
        # Use payload as bytes directly
        # Call the API using the correct v3 SDK structure
        response = deepgram.listen.v1.media.transcribe_file(
            request=audio_data, 
            model="nova-3", 
            language="ja", 
            smart_format=True
        )
        
        unique_transcript = response.results.channels[0].alternatives[0].transcript
        
        return {"transcript": unique_transcript}
    except Exception as e:
        print(f"Deepgram Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate")
async def translate_text(text: str):
    try:
        # Use deep-translator (Google Translate)
        target = "en"
        translated = GoogleTranslator(source='auto', target=target).translate(text)
        return {"translation": translated}
    except Exception as e:
         print(f"Translation Error: {e}")
         # Mock fallback
         return {"translation": f"[Mock Translation]: {text}"}
