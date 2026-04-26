import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
import pickle
import os

print("Loading dataset...")
df = pd.read_csv(r"C:\Users\User\sentinel-ai\data\creditcard.csv")

print(f"Dataset shape: {df.shape}")
print(f"Fraud cases: {df['Class'].sum()} ({df['Class'].mean()*100:.3f}%)")

# Features and target
X = df.drop(columns=["Class"])
y = df["Class"]

# Scale Amount and Time (V1-V28 are already scaled by PCA)
scaler = StandardScaler()
X["Amount"] = scaler.fit_transform(X[["Amount"]])
X["Time"] = scaler.fit_transform(X[["Time"]])

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Training XGBoost model...")

# Handle class imbalance — fraud is rare so we weight it higher
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    scale_pos_weight=scale_pos_weight,
    use_label_encoder=False,
    eval_metric="auc",
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

# Evaluate
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print("\n--- Model Performance ---")
print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

# Save model and scaler
os.makedirs("models", exist_ok=True)
with open("models/fraud_model.pkl", "wb") as f:
    pickle.dump(model, f)
with open("models/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

# Save feature names
feature_names = X.columns.tolist()
with open("models/feature_names.pkl", "wb") as f:
    pickle.dump(feature_names, f)

print("\nModel saved to models/fraud_model.pkl")
print("Training complete!")