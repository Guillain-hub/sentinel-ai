from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

try:
    from .model import predict_transaction, models_loaded
    from .simulator import get_random_transaction
except ImportError:
    from model import predict_transaction, models_loaded
    from simulator import get_random_transaction

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