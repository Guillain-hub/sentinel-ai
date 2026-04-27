import numpy as np
import random

MERCHANT_NAMES = [
    "Kigali Supermarket", "MTN Mobile Money", "Equity Bank ATM",
    "Amazon Purchase", "Uber Ride", "Hotel des Mille Collines",
    "Airtel Money Transfer", "Visa Online Payment", "Netflix Subscription",
    "Apple Store", "Shell Petrol Station", "Booking.com"
]

LOCATIONS = [
    "Kigali, Rwanda", "Nairobi, Kenya", "Lagos, Nigeria",
    "London, UK", "New York, USA", "Dubai, UAE",
    "Paris, France", "Johannesburg, SA"
]

# Real fraud signature values extracted from creditcard.csv training data
FRAUD_PATTERNS = [
    {"V1": -3.0, "V2": 3.5, "V3": -4.0, "V4": 4.5, "V14": -8.0, "V17": -5.0},
    {"V1": -4.5, "V2": 2.0, "V3": -3.5, "V4": 3.0, "V14": -6.0, "V17": -4.0},
    {"V1": -2.5, "V2": 4.0, "V3": -5.0, "V4": 5.0, "V14": -9.0, "V17": -6.0},
]

def get_random_transaction():
    is_fraud = random.random() < 0.08  # 8% fraud rate

    features = {}

    if is_fraud:
        # Use a real fraud pattern as base so model catches it
        pattern = random.choice(FRAUD_PATTERNS)
        for i in range(1, 29):
            key = f"V{i}"
            if key in pattern:
                features[key] = pattern[key] + np.random.normal(0, 0.3)
            else:
                features[key] = np.random.normal(0, 1)
        features["Amount"] = random.uniform(500, 5000)
        features["Time"] = random.uniform(0, 172800)
    else:
        # Normal transaction — values close to 0
        for i in range(1, 29):
            features[f"V{i}"] = np.random.normal(0, 0.5)
        features["Amount"] = random.uniform(1, 300)
        features["Time"] = random.uniform(0, 172800)

    features["_merchant"] = random.choice(MERCHANT_NAMES)
    features["_location"] = random.choice(LOCATIONS)
    features["_amount_display"] = round(features["Amount"], 2)
    features["_actual_label"] = 1 if is_fraud else 0

    return features