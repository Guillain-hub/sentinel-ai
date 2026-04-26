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

def get_random_transaction():
    is_fraud = random.random() < 0.05
    
    # Generate synthetic transaction features (V1-V28 + Time + Amount)
    features = {}
    for i in range(1, 29):
        features[f"V{i}"] = np.random.normal(0, 1) if not is_fraud else np.random.normal(random.choice([-3, 3]), 1.5)
    
    features["Time"] = random.uniform(0, 172800)
    features["Amount"] = random.uniform(200, 5000) if is_fraud else random.uniform(1, 500)
    
    features["_merchant"] = random.choice(MERCHANT_NAMES)
    features["_location"] = random.choice(LOCATIONS)
    features["_amount_display"] = round(features["Amount"], 2)
    features["_actual_label"] = 1 if is_fraud else 0

    return features