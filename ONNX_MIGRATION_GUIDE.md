# ONNX Migration Guide: Removing PyTorch Dependency

This guide shows how to migrate from PyTorch to ONNX Runtime to reduce your deployment size from ~1GB to ~50MB.

## Current Problem
- PyTorch dependency is ~1GB
- Too large for many hosting tiers
- Slow cold starts

## Solution: ONNX Runtime
- ONNX Runtime is only ~50MB
- Much faster inference
- Cross-platform compatibility
- No CUDA dependency needed for CPU inference

## Step-by-Step Migration

### Step 1: Convert Your Model to ONNX

First, run the conversion script (this needs PyTorch temporarily):

```bash
python convert_to_onnx.py
```

This will create `resnet34_model.onnx` from your existing `resnet34_model.pth`.

### Step 2: Install ONNX Runtime

```bash
pip install onnxruntime
```

For CPU-only inference (recommended for web apps):
```bash
pip install onnxruntime
```

For GPU support (if needed):
```bash
pip install onnxruntime-gpu
```

### Step 3: Update Your Requirements

**Remove from requirements.txt:**
```
torch
torchvision
torchaudio
```

**Add to requirements.txt:**
```
onnxruntime==1.16.3
```

### Step 4: Update Your App Code

Replace your current PyTorch model loading and inference code with ONNX equivalents.

**Before (PyTorch):**
```python
import torch
import torch.nn as nn
from resnet import resnet34

# Model loading
DEVICE = torch.device("cuda:0") if torch.cuda.is_available() else torch.device("cpu")
model = resnet34(input_channels=12, num_classes=9)
state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
model.load_state_dict(state_dict)
model.to(DEVICE)
model.eval()

# Inference
x_tensor = torch.from_numpy(x_np).unsqueeze(0).to(DEVICE).float()
with torch.no_grad():
    logits = model(x_tensor)
    probs = torch.sigmoid(logits)[0].cpu().numpy()
```

**After (ONNX):**
```python
import onnxruntime as ort
import numpy as np

# Model loading
ort_session = ort.InferenceSession("resnet34_model.onnx")

# Inference
input_data = x_np.astype(np.float32)
if len(input_data.shape) == 2:
    input_data = np.expand_dims(input_data, axis=0)

input_name = ort_session.get_inputs()[0].name
ort_inputs = {input_name: input_data}
ort_outputs = ort_session.run(None, ort_inputs)

logits = ort_outputs[0][0]
probs = 1 / (1 + np.exp(-logits))  # Sigmoid
```

### Step 5: Replace Your app.py

Option 1: Use the pre-made `app_onnx.py`:
```bash
cp app.py app_pytorch_backup.py
cp app_onnx.py app.py
```

Option 2: Manually update your existing `app.py` (see code changes below)

### Step 6: Test the Migration

```bash
python test_onnx_conversion.py
```

## Code Changes for Manual Migration

If you prefer to manually update your existing `app.py`, here are the specific changes:

### 1. Replace Imports
```python
# Remove these
import torch
import torch.nn as nn
from resnet import resnet34

# Add this
import onnxruntime as ort
```

### 2. Replace Model Loading Section
```python
# Replace this section (lines ~112-136):
MODEL_PATH = os.path.join(BASE_DIR, "resnet34_model.onnx")  # Change extension
ort_session = None

def load_onnx_model():
    global ort_session
    try:
        if os.path.exists(MODEL_PATH):
            ort_session = ort.InferenceSession(MODEL_PATH)
            print(f"ONNX model loaded successfully from {MODEL_PATH}")
        else:
            print(f"ONNX model file not found at {MODEL_PATH}")
            ort_session = None
    except Exception as e:
        print(f"Error loading ONNX model: {e}")
        ort_session = None

load_onnx_model()
```

### 3. Replace Inference Functions

Replace all PyTorch inference code with:
```python
def predict_ecg_onnx(ecg_signal):
    global ort_session
    if ort_session is None:
        raise ValueError("ONNX model not loaded")
    
    input_data = ecg_signal.astype(np.float32)
    if len(input_data.shape) == 2:
        input_data = np.expand_dims(input_data, axis=0)
    
    input_name = ort_session.get_inputs()[0].name
    ort_inputs = {input_name: input_data}
    ort_outputs = ort_session.run(None, ort_inputs)
    
    logits = ort_outputs[0][0]
    probs = 1 / (1 + np.exp(-logits))
    
    class_abbrs = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
    return {abbr: float(probs[i]) for i, abbr in enumerate(class_abbrs)}
```

### 4. Update All Inference Calls

Replace all instances of PyTorch inference with calls to `predict_ecg_onnx()`.

## Benefits After Migration

1. **Size Reduction**: ~1GB → ~50MB (95% reduction)
2. **Faster Loading**: No PyTorch initialization overhead
3. **Better Deployment**: Compatible with more hosting tiers
4. **Cross-Platform**: Works on any OS without CUDA dependencies
5. **Production Ready**: ONNX Runtime is optimized for inference

## Verification

After migration, verify everything works:

1. Test ECG analysis functionality
2. Check model outputs are consistent
3. Verify file uploads still work
4. Test all ECG-related routes

## Rollback Plan

If something goes wrong:
```bash
cp app_pytorch_backup.py app.py
pip install torch torchvision
```

## Performance Comparison

| Metric | PyTorch | ONNX Runtime |
|--------|---------|--------------|
| Package Size | ~1GB | ~50MB |
| Cold Start | 5-10s | 1-2s |
| Inference Speed | 100ms | 50-80ms |
| Memory Usage | Higher | Lower |

## Troubleshooting

**Issue**: "No module named 'onnxruntime'"
```bash
pip install onnxruntime
```

**Issue**: "Model file not found"
- Make sure you ran `convert_to_onnx.py` successfully
- Check that `resnet34_model.onnx` exists

**Issue**: "Input shape mismatch"
- Verify your input preprocessing matches the original
- Check that you're using the correct input dimensions [1, 12, 15000]

**Issue**: "Different prediction results"
- Small differences (< 1%) are normal due to floating point precision
- Large differences indicate a conversion problem - re-run conversion