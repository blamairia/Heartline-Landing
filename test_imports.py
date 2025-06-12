#!/usr/bin/env python3
"""
Simple test to check if we can import required modules
"""

print("Testing imports...")

try:
    import torch
    print("✅ PyTorch available:", torch.__version__)
except ImportError as e:
    print("❌ PyTorch not available:", e)

try:
    import onnx
    print("✅ ONNX available:", onnx.__version__)
except ImportError as e:
    print("❌ ONNX not available:", e)

try:
    import onnxruntime
    print("✅ ONNX Runtime available:", onnxruntime.__version__)
except ImportError as e:
    print("❌ ONNX Runtime not available:", e)

try:
    from resnet import resnet34
    print("✅ ResNet34 module available")
except ImportError as e:
    print("❌ ResNet34 module not available:", e)

import os
model_path = "resnet34_model.pth"
if os.path.exists(model_path):
    print("✅ PyTorch model file exists:", model_path)
    print("  File size:", os.path.getsize(model_path) / (1024*1024), "MB")
else:
    print("❌ PyTorch model file not found:", model_path)

print("Test completed!")
