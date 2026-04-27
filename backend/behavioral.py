import random
import numpy as np
from datetime import datetime

DEVICES = ["iPhone 14", "Samsung Galaxy S23", "MacBook Pro", "Windows PC", "iPad", "Unknown Device"]
BROWSERS = ["Chrome", "Safari", "Firefox", "Edge"]
USERS = ["Alice M.", "John K.", "Grace N.", "David O.", "Sarah W.", "James R.", "Mary A.", "Peter L."]

# Simulate stored user profiles (normal behavior baseline)
user_profiles = {
    user: {
        "usual_location": random.choice(["Kigali, Rwanda", "Nairobi, Kenya", "Lagos, Nigeria"]),
        "usual_device": random.choice(DEVICES),
        "usual_login_hour": random.randint(8, 18),
        "usual_tx_amount": random.uniform(50, 300),
    }
    for user in USERS
}

session_history = []

def generate_session():
    user = random.choice(USERS)
    profile = user_profiles[user]
    
    is_anomaly = random.random() < 0.12  # 12% anomaly rate

    if is_anomaly:
        anomaly_type = random.choice([
            "location_jump", "new_device", "odd_hours", "high_velocity"
        ])
    else:
        anomaly_type = None

    # Generate session features
    if anomaly_type == "location_jump":
        location = random.choice(["Moscow, Russia", "Beijing, China", "Anonymous VPN", "Dubai, UAE"])
        device = profile["usual_device"]
        login_hour = profile["usual_login_hour"]
        tx_amount = profile["usual_tx_amount"] * random.uniform(0.8, 1.2)
    elif anomaly_type == "new_device":
        location = profile["usual_location"]
        device = random.choice([d for d in DEVICES if d != profile["usual_device"]])
        login_hour = profile["usual_login_hour"]
        tx_amount = profile["usual_tx_amount"] * random.uniform(0.8, 1.2)
    elif anomaly_type == "odd_hours":
        location = profile["usual_location"]
        device = profile["usual_device"]
        login_hour = random.choice([1, 2, 3, 4, 23])
        tx_amount = profile["usual_tx_amount"] * random.uniform(2, 5)
    elif anomaly_type == "high_velocity":
        location = profile["usual_location"]
        device = profile["usual_device"]
        login_hour = profile["usual_login_hour"]
        tx_amount = profile["usual_tx_amount"] * random.uniform(5, 10)
    else:
        location = profile["usual_location"]
        device = profile["usual_device"]
        login_hour = profile["usual_login_hour"] + random.randint(-2, 2)
        tx_amount = profile["usual_tx_amount"] * random.uniform(0.5, 1.5)

    # Score the anomaly
    risk_score = 0.0
    reasons = []

    if location != profile["usual_location"]:
        risk_score += 0.4
        reasons.append(f"Unusual location: {location}")
    if device != profile["usual_device"]:
        risk_score += 0.3
        reasons.append(f"New device: {device}")
    if login_hour < 6 or login_hour > 22:
        risk_score += 0.2
        reasons.append(f"Login at odd hour: {login_hour:02d}:00")
    if tx_amount > profile["usual_tx_amount"] * 3:
        risk_score += 0.3
        reasons.append(f"High transaction amount: ${tx_amount:.0f}")

    risk_score = min(round(risk_score + random.uniform(0, 0.1), 2), 1.0)
    is_flagged = risk_score > 0.4

    session = {
        "id": f"S{random.randint(1000,9999)}",
        "user": user,
        "location": location,
        "device": device,
        "browser": random.choice(BROWSERS),
        "login_hour": f"{login_hour:02d}:00",
        "tx_amount": round(tx_amount, 2),
        "risk_score": risk_score,
        "is_flagged": is_flagged,
        "anomaly_type": anomaly_type,
        "reasons": reasons,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "usual_location": profile["usual_location"],
        "usual_device": profile["usual_device"],
    }

    session_history.append(session)
    if len(session_history) > 100:
        session_history.pop(0)

    return session
