from pathlib import Path
import pickle
import numpy as np
import shap
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

with open(MODEL_DIR / "fraud_model.pkl", "rb") as f:
    model = pickle.load(f)
with open(MODEL_DIR / "scaler.pkl", "rb") as f:
    scaler = pickle.load(f)
with open(MODEL_DIR / "feature_names.pkl", "rb") as f:
    feature_names = pickle.load(f)

explainer = shap.TreeExplainer(model)

def predict_transaction(transaction: dict):
    df = pd.DataFrame([transaction])
    df = df[feature_names]

    # Scale Amount and Time using separate scalers per column
    df["Amount"] = (df["Amount"] - df["Amount"].mean()) / (df["Amount"].std() + 1e-8)
    df["Time"] = (df["Time"] - df["Time"].mean()) / (df["Time"].std() + 1e-8)

    prob = model.predict_proba(df)[0][1]
    is_fraud = bool(prob > 0.5)

    shap_values = explainer.shap_values(df)
    shap_dict = dict(zip(feature_names, shap_values[0]))
    top_factors = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
    reasons = [{"feature": k, "impact": round(float(v), 4)} for k, v in top_factors]

    return {
        "fraud_probability": round(float(prob), 4),
        "is_fraud": is_fraud,
        "risk_level": "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.3 else "LOW",
        "reasons": reasons
    }