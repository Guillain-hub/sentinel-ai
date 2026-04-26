import pandas as pd
import numpy as np
import random

# Load real data to sample from
df = pd.read_csv(r"C:\Users\User\sentinel-ai\data\creditcard.csv")

legitimate = df[df["Class"] == 0]
fraudulent = df[df["Class"] == 1]

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
    # 95% legitimate, 5% fraud — realistic ratio for demo
    is_fraud = random.random() < 0.05
    
    if is_fraud:
        row = fraudulent.sample(1).iloc[0]
    else:
        row = legitimate.sample(1).iloc[0]

    features = {col: float(row[col]) for col in df.columns if col != "Class"}
    
    # Add display metadata
    features["_merchant"] = random.choice(MERCHANT_NAMES)
    features["_location"] = random.choice(LOCATIONS)
    features["_amount_display"] = round(abs(features["Amount"]), 2)
    features["_actual_label"] = int(row["Class"])

    return features