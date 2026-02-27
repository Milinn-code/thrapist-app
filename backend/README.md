# Backend

Python + FastAPI

## セットアップ

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # 環境変数を設定する
```

## 起動

```bash
uvicorn app.main:app --reload
```

API仕様書（Swagger UI）: http://localhost:8000/docs
