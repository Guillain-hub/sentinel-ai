import random
import uuid
from datetime import datetime

ATTACK_TYPES = [
    {"name": "Brute Force Attack", "severity": "CRITICAL", "description": "Multiple failed login attempts detected"},
    {"name": "Credential Stuffing", "severity": "HIGH", "description": "Known leaked credentials used"},
    {"name": "API Abuse", "severity": "HIGH", "description": "Unusual API call volume detected"},
    {"name": "SQL Injection Attempt", "severity": "CRITICAL", "description": "Malicious SQL pattern in request"},
    {"name": "Geographic Anomaly", "severity": "MEDIUM", "description": "Login from unusual location"},
    {"name": "Session Hijacking", "severity": "HIGH", "description": "Suspicious session token reuse"},
    {"name": "DDoS Pattern", "severity": "CRITICAL", "description": "High volume requests from single source"},
    {"name": "Data Exfiltration", "severity": "CRITICAL", "description": "Unusual data transfer volume"},
    {"name": "Phishing Link Detected", "severity": "MEDIUM", "description": "Known phishing URL in request"},
    {"name": "Port Scanning", "severity": "LOW", "description": "Sequential port access detected"},
]

SOURCE_IPS = [
    "41.xxx.xxx.xxx (Nigeria)", "196.xxx.xxx.xxx (Kenya)",
    "105.xxx.xxx.xxx (Rwanda)", "102.xxx.xxx.xxx (South Africa)",
    "185.xxx.xxx.xxx (Russia)", "218.xxx.xxx.xxx (China)",
    "45.xxx.xxx.xxx (Brazil)", "91.xxx.xxx.xxx (Eastern Europe)",
]

SEVERITY_COLORS = {
    "CRITICAL": "#ef4444",
    "HIGH": "#f59e0b",
    "MEDIUM": "#3b82f6",
    "LOW": "#22c55e"
}

threat_stats = {
    "total_threats": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "blocked": 0
}

def generate_threat():
    attack = random.choice(ATTACK_TYPES)
    threat = {
        "id": str(uuid.uuid4())[:8],
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "type": attack["name"],
        "severity": attack["severity"],
        "description": attack["description"],
        "source_ip": random.choice(SOURCE_IPS),
        "target": random.choice(["API Gateway", "Auth Service", "Payment API", "User Database", "Admin Portal"]),
        "status": "BLOCKED" if random.random() > 0.15 else "INVESTIGATING",
        "color": SEVERITY_COLORS[attack["severity"]]
    }
    
    threat_stats["total_threats"] += 1
    threat_stats[attack["severity"].lower()] += 1
    if threat["status"] == "BLOCKED":
        threat_stats["blocked"] += 1
    
    return threat

def get_threat_stats():
    return threat_stats
