from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

try:
    from .model import predict_transaction, models_loaded
    from .simulator import get_random_transaction
    from .behavioral import generate_session
    from .api_protection import generate_api_event
except ImportError:
    from model import predict_transaction, models_loaded
    from simulator import get_random_transaction
    from behavioral import generate_session
    from api_protection import generate_api_event

import asyncio
import json
import uuid
from datetime import datetime

app = FastAPI(title="Sentinel AI - Security Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store last 100 transactions in memory
transaction_history = []
stats = {
    "total": 0,
    "fraud_detected": 0,
    "legitimate": 0,
    "total_amount_protected": 0.0
}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": models_loaded,
    }

@app.get("/")
def root():
    return {"status": "Sentinel AI is running"}

@app.get("/stats")
def get_stats():
    return stats

@app.get("/transactions")
def get_transactions():
    return transaction_history[-50:]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Dashboard connected via WebSocket")
    try:
        while True:
            # Generate a transaction every 1.5 seconds
            raw = get_random_transaction()

            # Extract display fields
            merchant = raw.pop("_merchant")
            location = raw.pop("_location")
            amount_display = raw.pop("_amount_display")
            actual_label = raw.pop("_actual_label")

            # Run AI prediction
            result = predict_transaction(raw)

            # Build transaction record
            transaction = {
                "id": str(uuid.uuid4())[:8],
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "merchant": merchant,
                "location": location,
                "amount": amount_display,
                "fraud_probability": result["fraud_probability"],
                "is_fraud": result["is_fraud"],
                "risk_level": result["risk_level"],
                "reasons": result["reasons"],
                "actual_label": actual_label
            }

            # Update stats
            stats["total"] += 1
            if result["is_fraud"]:
                stats["fraud_detected"] += 1
                stats["total_amount_protected"] += amount_display
            else:
                stats["legitimate"] += 1

            transaction_history.append(transaction)
            if len(transaction_history) > 100:
                transaction_history.pop(0)

            # Send to dashboard
            await websocket.send_text(json.dumps(transaction))
            await asyncio.sleep(1.5)

    except WebSocketDisconnect:
        print("Dashboard disconnected")

behavioral_history = []
behavioral_stats = {"total": 0, "flagged": 0, "safe": 0}

@app.websocket("/ws/behavioral")
async def behavioral_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Behavioral AI dashboard connected")
    try:
        while True:
            session = generate_session()
            behavioral_stats["total"] += 1
            if session["is_flagged"]:
                behavioral_stats["flagged"] += 1
            else:
                behavioral_stats["safe"] += 1
            behavioral_history.append(session)
            if len(behavioral_history) > 100:
                behavioral_history.pop(0)
            await websocket.send_text(json.dumps(session))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        print("Behavioral dashboard disconnected")

@app.get("/behavioral/stats")
def get_behavioral_stats():
    return behavioral_stats

@app.get("/behavioral/sessions")
def get_behavioral_sessions():
    return behavioral_history[-50:]

api_history_store = []
api_stats = {"total": 0, "blocked": 0, "safe": 0, "attacks": 0}

@app.websocket("/ws/api-protection")
async def api_protection_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("API Protection dashboard connected")
    try:
        while True:
            event = generate_api_event()
            api_stats["total"] += 1
            if event["is_blocked"]:
                api_stats["blocked"] += 1
                api_stats["attacks"] += 1
            else:
                api_stats["safe"] += 1
            api_history_store.append(event)
            if len(api_history_store) > 100:
                api_history_store.pop(0)
            await websocket.send_text(json.dumps(event))
            await asyncio.sleep(1.2)
    except WebSocketDisconnect:
        print("API Protection dashboard disconnected")

@app.get("/api-protection/stats")
def get_api_stats():
    return api_stats

@app.get("/api-protection/events")
def get_api_events():
    return api_history_store[-50:]