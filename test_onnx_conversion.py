#!/usr/bin/env python3
"""
Test script to verify ONNX model conversion and compare with PyTorch.
Run this after converting your model to ONNX.
"""

import numpy as np
import os

def test_onnx_model():
    """Test ONNX model loading and inference"""
    
    try:
        import onnxruntime as ort
    except ImportError:
        print("❌ ONNX Runtime not installed. Run: pip install onnxruntime")
        return False
    
    model_path = "resnet34_model.onnx"
    
    if not os.path.exists(model_path):
        print(f"❌ ONNX model not found at {model_path}")
        print("Run convert_to_onnx.py first to create the ONNX model")
        return False
    
    try:
        # Load ONNX model
        print("Loading ONNX model...")
        ort_session = ort.InferenceSession(model_path)
        
        # Get model info
        input_info = ort_session.get_inputs()[0]
        output_info = ort_session.get_outputs()[0]
        
        print(f"✅ ONNX model loaded successfully")
        print(f"   Input: {input_info.name}, shape: {input_info.shape}")
        print(f"   Output: {output_info.name}, shape: {output_info.shape}")
        
        # Create test data
        print("\nTesting inference...")
        test_input = np.random.randn(1, 12, 15000).astype(np.float32)
        
        # Run inference
        ort_inputs = {input_info.name: test_input}
        ort_outputs = ort_session.run(None, ort_inputs)
        
        # Apply sigmoid
        logits = ort_outputs[0][0]
        probs = 1 / (1 + np.exp(-logits))
        
        # Verify output shape and values
        assert len(probs) == 9, f"Expected 9 outputs, got {len(probs)}"
        assert all(0 <= p <= 1 for p in probs), "Probabilities should be between 0 and 1"
        
        print(f"✅ Inference successful")
        print(f"   Output shape: {ort_outputs[0].shape}")
        print(f"   Probability range: {probs.min():.3f} - {probs.max():.3f}")
        
        # Map to class names
        class_names = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
        predictions = {name: float(prob) for name, prob in zip(class_names, probs)}
        
        print(f"\nSample predictions:")
        for name, prob in predictions.items():
            print(f"   {name}: {prob:.1%}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing ONNX model: {e}")
        return False

def compare_pytorch_onnx():
    """Compare PyTorch and ONNX outputs if PyTorch is available"""
    
    pytorch_available = True
    try:
        import torch
        from resnet import resnet34
    except ImportError:
        print("ℹ️  PyTorch not available for comparison (this is expected after migration)")
        pytorch_available = False
    
    if not pytorch_available:
        return True
    
    try:
        import onnxruntime as ort
        
        # Load both models
        pytorch_model_path = "resnet34_model.pth"
        onnx_model_path = "resnet34_model.onnx"
        
        if not os.path.exists(pytorch_model_path) or not os.path.exists(onnx_model_path):
            print("ℹ️  Model files not found for comparison")
            return True
        
        print("\nComparing PyTorch vs ONNX outputs...")
        
        # Load PyTorch model
        pytorch_model = resnet34(input_channels=12, num_classes=9)
        state_dict = torch.load(pytorch_model_path, map_location='cpu')
        pytorch_model.load_state_dict(state_dict)
        pytorch_model.eval()
        
        # Load ONNX model
        ort_session = ort.InferenceSession(onnx_model_path)
        
        # Test with same input
        test_input = np.random.randn(1, 12, 15000).astype(np.float32)
        test_input_torch = torch.from_numpy(test_input)
        
        # PyTorch inference
        with torch.no_grad():
            pytorch_output = pytorch_model(test_input_torch)
            pytorch_probs = torch.sigmoid(pytorch_output)[0].numpy()
        
        # ONNX inference
        input_name = ort_session.get_inputs()[0].name
        ort_inputs = {input_name: test_input}
        ort_outputs = ort_session.run(None, ort_inputs)
        onnx_logits = ort_outputs[0][0]
        onnx_probs = 1 / (1 + np.exp(-onnx_logits))
        
        # Compare outputs
        max_diff = np.max(np.abs(pytorch_probs - onnx_probs))
        mean_diff = np.mean(np.abs(pytorch_probs - onnx_probs))
        
        print(f"   Max difference: {max_diff:.6f}")
        print(f"   Mean difference: {mean_diff:.6f}")
        
        if max_diff < 1e-3:
            print("✅ Outputs are very close - conversion successful!")
        elif max_diff < 1e-2:
            print("⚠️  Small differences detected - acceptable for most use cases")
        else:
            print("❌ Large differences detected - check conversion")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error comparing models: {e}")
        return False

def check_app_readiness():
    """Check if the app is ready for ONNX deployment"""
    
    print("\nChecking deployment readiness...")
    
    checks = []
    
    # Check ONNX model exists
    if os.path.exists("resnet34_model.onnx"):
        checks.append("✅ ONNX model file exists")
    else:
        checks.append("❌ ONNX model file missing - run convert_to_onnx.py")
    
    # Check if app_onnx.py exists
    if os.path.exists("app_onnx.py"):
        checks.append("✅ ONNX-based app code available")
    else:
        checks.append("❌ app_onnx.py missing")
    
    # Check requirements
    try:
        import onnxruntime
        checks.append("✅ ONNX Runtime installed")
    except ImportError:
        checks.append("❌ ONNX Runtime not installed - run: pip install onnxruntime")
    
    # Check other dependencies
    try:
        import flask, numpy, wfdb
        checks.append("✅ Core dependencies available")
    except ImportError as e:
        checks.append(f"❌ Missing dependency: {e}")
    
    for check in checks:
        print(f"   {check}")
    
    all_good = all("✅" in check for check in checks)
    
    if all_good:
        print("\n🎉 Ready for deployment! You can now:")
        print("   1. Update requirements.txt to remove torch and add onnxruntime")
        print("   2. Replace app.py with app_onnx.py")
        print("   3. Deploy without PyTorch dependency")
    else:
        print("\n❌ Not ready for deployment. Fix the issues above.")
    
    return all_good

if __name__ == "__main__":
    print("🔍 Testing ONNX Model Conversion")
    print("=" * 50)
    
    # Test ONNX model
    onnx_ok = test_onnx_model()
    
    if onnx_ok:
        # Compare with PyTorch if available
        compare_pytorch_onnx()
        
        # Check deployment readiness
        check_app_readiness()
    else:
        print("\n❌ ONNX model test failed. Please check the conversion.")
    
    print("\n" + "=" * 50)
    if onnx_ok:
        print("✅ Tests completed successfully!")
    else:
        print("❌ Tests failed. Please fix the issues above.")