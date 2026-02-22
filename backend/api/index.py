from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from google import genai
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
import MeCab
import httpx # <--- Dùng cái này thay cho supabase client

# Load biến môi trường
load_dotenv(".env.local")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Cấu hình Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Lỗi Gemini: {e}")

# 2. Cấu hình Supabase (REST API)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 3. Cấu hình MeCab
try:
    tagger = MeCab.Tagger("-Owakati")
except Exception as e:
    tagger = None

class VocabRequest(BaseModel):
    word: str

class StoryRequest(BaseModel):
    vocab_list: List[str]
    topic: Optional[str] = "đời thường"

class TokenizeRequest(BaseModel):
    text: str

def generate_content_with_fallback(prompt: str, preferred_model: str = 'gemini-2.0-flash'):
    # ... (Giữ nguyên hàm fallback cũ của bạn) ...
    models_to_try = [preferred_model, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    last_error = None
    for model_id in models_to_try:
        try:
            print(f"🔄 AI Try: {model_id}...")
            response = gemini_client.models.generate_content(model=model_id, contents=prompt)
            print(f"✅ AI Success: {model_id}")
            return response
        except Exception as e:
            print(f"❌ AI Fail {model_id}: {e}")
            last_error = e
            continue
    if last_error: raise last_error

# --- ENDPOINTS ---

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "N1 Synapse Backend (Cache Enabled via REST)"}

@app.post("/api/nlp/tokenize")
async def tokenize_text(req: TokenizeRequest):
    if not tagger: return {"tokens": [req.text]}
    try:
        parsed = tagger.parse(req.text).strip()
        tokens = [t for t in parsed.split(" ") if t.strip()]
        return {"tokens": tokens}
    except: return {"tokens": [req.text]}

# --- LOGIC TRA TỪ THÔNG MINH (CACHE FIRST) ---
@app.post("/api/nlp/lookup")
async def lookup_word(req: VocabRequest):
    word = req.word.strip()
    
    # BƯỚC 1: KIỂM TRA DATABASE (CACHE) bằng REST API
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            print(f"🔍 Checking cache for: {word}")
            async with httpx.AsyncClient() as client:
                # Gọi Supabase REST API: GET /rest/v1/dictionary?word=eq.{word}
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/dictionary",
                    params={"word": f"eq.{word}", "select": "*"},
                    headers={
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                    }
                )
                
                if response.status_code == 200:
                    data_list = response.json()
                    if data_list and len(data_list) > 0:
                        print("🎯 CACHE HIT! Trả về ngay lập tức.")
                        return data_list[0]
        except Exception as e:
            print(f"⚠️ Cache Error (Skipping): {e}")

    # BƯỚC 2: NẾU KHÔNG CÓ -> HỎI GEMINI (MISS)
    if not gemini_client: raise HTTPException(status_code=500, detail="Chưa cấu hình AI")
    
    try:
        print("🤖 Calling Gemini...")
        prompt = f"""
        Bạn là từ điển N1. Phân tích từ: {word}.
        Trả về JSON thuần túy (không markdown):
        {{
            "reading": "Hiragana",
            "kanji_meaning": "Âm Hán Việt (nếu có, viết HOA. VD: TIÊN SINH)",
            "meaning": "Nghĩa tiếng Việt ngắn gọn",
            "part_of_speech": "Từ loại",
            "example_sentence": "Câu ví dụ tiếng Nhật N1 số 1",
            "example_translation": "Dịch nghĩa câu ví dụ 1",
            "example_sentence_2": "Câu ví dụ tiếng Nhật N1 số 2 (ngữ cảnh khác)",
            "example_translation_2": "Dịch nghĩa câu ví dụ 2"
        }}
        """
        response = generate_content_with_fallback(prompt, 'gemini-2.0-flash')
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)

        # BƯỚC 3: LƯU VÀO DATABASE CHO LẦN SAU (REST API)
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                # Chuẩn bị dữ liệu để lưu
                cache_entry = {
                    "word": word,
                    "reading": data.get("reading"),
                    "kanji_meaning": data.get("kanji_meaning"),
                    "meaning": data.get("meaning"),
                    "part_of_speech": data.get("part_of_speech"),
                    "example_sentence": data.get("example_sentence"),
                    "example_translation": data.get("example_translation"),
                    "example_sentence_2": data.get("example_sentence_2"),
                    "example_translation_2": data.get("example_translation_2")
                }
                
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{SUPABASE_URL}/rest/v1/dictionary",
                        json=cache_entry,
                        headers={
                            "apikey": SUPABASE_KEY,
                            "Authorization": f"Bearer {SUPABASE_KEY}",
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal" # Không cần trả về dữ liệu vừa insert
                        }
                    )
                print("💾 Saved to Cache.")
            except Exception as e:
                print(f"⚠️ Save Cache Error: {e}")

        return data

    except Exception as e:
        print(f"Fatal Lookup Error: {e}")
        return {"reading": "...", "meaning": "Lỗi AI", "example_sentence": "", "example_translation": ""}

@app.post("/api/ai/generate_story")
async def generate_story(req: StoryRequest):
    if not gemini_client: raise HTTPException(status_code=500, detail="Chưa cấu hình AI")
    try:
        vocab_str = ", ".join(req.vocab_list)
        prompt = f"""
        Viết một câu chuyện ngắn tiếng Nhật (khoảng 200-300 chữ) chủ đề '{req.topic}'.
        Yêu cầu:
        1. Sử dụng TẤT CẢ các từ: [{vocab_str}].
        2. In đậm từ vựng bằng markdown (**từ**).
        3. Câu chuyện phải LIỀN MẠCH, LOGIC.
        4. Tách thành từng câu và dịch sang tiếng Việt.
        Trả về mảng JSON thuần túy: [{{ "jp": "...", "vi": "..." }}]
        """
        response = generate_content_with_fallback(prompt, 'gemini-2.0-flash')
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        return {"story": json.loads(clean_text)}
    except Exception as e:
        print(f"Story Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tạo truyện")