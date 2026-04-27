import random
import numpy as np
from datetime import datetime

ENDPOINTS = [
    "/api/v1/login",
    "/api/v1/transfer",
    "/api/v1/balance",
    "/api/v1/accounts",
    "/api/v1/cards",
    "/api/v1/transactions",
    "/api/v1/reset-password",
    "/api/v1/verify-otp",
    "/api/v1/admin/users",
    "/api/v1/admin/config",
]

METHODS = ["GET", "POST", "PUT", "DELETE"]

SUSPICIOUS_ENDPOINTS = [
    "/api/v1/admin/users",
    "/api/v1/admin/config",
    "/api/v1/reset-password",
    "/api/v1/login",
]

IP_POOL_NORMAL = [f"41.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}" for _ in range(20)]
IP_POOL_ATTACK = [f"185.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}" for _ in range(5)]

# Track call counts per IP (simulated)
ip_call_counts = {}
api_history = []

ATTACK_TYPES = [
    "brute_force",
    "credential_stuffing",
    "rate_limit_exceeded",
    "suspicious_endpoint",
    "sql_injection_attempt",
]

def generate_api_event():
    is_attack = random.random() < 0.1  # 10% attack rate

    if is_attack:
        attack_type = random.choice(ATTACK_TYPES)
        ip = random.choice(IP_POOL_ATTACK)
        
        if attack_type == "brute_force":
            endpoint = "/api/v1/login"
            method = "POST"
            status_code = 401
            response_time = random.uniform(50, 150)
            request_count = random.randint(50, 200)
        elif attack_type == "credential_stuffing":
            endpoint = "/api/v1/login"
            method = "POST"
            status_code = random.choice([200, 401, 401, 401])
            response_time = random.uniform(100, 300)
            request_count = random.randint(30, 100)
        elif attack_type == "rate_limit_exceeded":
            endpoint = random.choice(ENDPOINTS)
            method = random.choice(["GET", "POST"])
            status_code = 429
            response_time = random.uniform(10, 50)
            request_count = random.randint(100, 500)
        elif attack_type == "suspicious_endpoint":
            endpoint = random.choice(SUSPICIOUS_ENDPOINTS)
            method = random.choice(["GET", "DELETE"])
            status_code = random.choice([403, 404, 200])
            response_time = random.uniform(200, 800)
            request_count = random.randint(5, 20)
        else:  # sql_injection
            endpoint = random.choice(ENDPOINTS)
            method = "POST"
            status_code = random.choice([400, 500])
            response_time = random.uniform(500, 2000)
            request_count = random.randint(1, 10)

        risk_score = round(random.uniform(0.65, 1.0), 2)
        is_blocked = risk_score > 0.75

    else:
        attack_type = None
        ip = random.choice(IP_POOL_NORMAL)
        endpoint = random.choice(ENDPOINTS)
        method = random.choice(METHODS)
        status_code = random.choice([200, 200, 200, 201, 400, 404])
        response_time = random.uniform(20, 300)
        request_count = random.randint(1, 10)
        risk_score = round(random.uniform(0.0, 0.3), 2)
        is_blocked = False

    # Track IP call counts
    ip_call_counts[ip] = ip_call_counts.get(ip, 0) + request_count

    event = {
        "id": f"API{random.randint(10000, 99999)}",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "ip": ip,
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "response_time": round(response_time, 1),
        "request_count": request_count,
        "risk_score": risk_score,
        "is_blocked": is_blocked,
        "attack_type": attack_type,
        "total_from_ip": ip_call_counts[ip],
    }

    api_history.append(event)
    if len(api_history) > 100:
        api_history.pop(0)

    return event
