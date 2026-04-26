from pathlib import Path
import pickle
import logging
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

_DEFAULT_FEATURE_NAMES = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount"]

model = None
scaler = None
feature_names = _DEFAULT_FEATURE_NAMES
_explainer = None
models_loaded = False

try:
    logger.info("Loading fraud model from %s...", MODEL_DIR / "fraud_model.pkl")
    with open(MODEL_DIR / "fraud_model.pkl", "rb") as f:
        model = pickle.load(f)
    logger.info("Fraud model loaded successfully.")

    logger.info("Loading scaler from %s...", MODEL_DIR / "scaler.pkl")
    with open(MODEL_DIR / "scaler.pkl", "rb") as f:
        scaler = pickle.load(f)
    logger.info("Scaler loaded successfully.")

    logger.info("Loading feature names from %s...", MODEL_DIR / "feature_names.pkl")
    with open(MODEL_DIR / "feature_names.pkl", "rb") as f:
        feature_names = pickle.load(f)
    logger.info("Feature names loaded successfully: %s", feature_names)

    models_loaded = True
    logger.info("All model artefacts loaded — full prediction mode active.")

except FileNotFoundError as exc:
    logger.warning("Model file not found (%s). Starting in degraded mode.", exc)
except Exception as exc:
    logger.error("Unexpected error loading model (%s: %s).", type(exc).__name__, exc)


def get_explainer():
    global _explainer
    if _explainer is None and model is not None:
        logger.info("Initialising SHAP TreeExplainer (lazy)...")
        import shap
        _explainer = shap.TreeExplainer(model)
        logger.info("SHAP explainer ready.")
    return _explainer


def _dummy_predict(transaction: dict) -> dict:
    logger.warning("Dummy prediction used — model files are not loaded.")
    return {
        "fraud_probability": 0.0,
        "is_fraud": False,
        "risk_level": "UNKNOWN",
        "reasons": [],
        "model_available": False,
    }


def predict_transaction(transaction: dict) -> dict:
    # Only check model/scaler — explainer loads lazily on first prediction
    if not models_loaded or model is None:
        return _dummy_predict(transaction)

    try:
        df = pd.DataFrame([transaction])
        df = df[feature_names]

        df["Amount"] = (df["Amount"] - df["Amount"].mean()) / (df["Amount"].std() + 1e-8)
        df["Time"] = (df["Time"] - df["Time"].mean()) / (df["Time"].std() + 1e-8)

        prob = model.predict_proba(df)[0][1]
        is_fraud = bool(prob > 0.5)

        reasons = []
        try:
            shap_values = get_explainer().shap_values(df)
            shap_dict = dict(zip(feature_names, shap_values[0]))
            top_factors = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
            reasons = [{"feature": k, "impact": round(float(v), 4)} for k, v in top_factors]
        except Exception as shap_exc:
            logger.warning("SHAP failed (%s), skipping explanations.", shap_exc)

        return {
            "fraud_probability": round(float(prob), 4),
            "is_fraud": is_fraud,
            "risk_level": "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.3 else "LOW",
            "reasons": reasons,
            "model_available": True,
        }
    except Exception as exc:
        logger.error("Prediction failed (%s: %s).", type(exc).__name__, exc)
        return _dummy_predict(transaction)