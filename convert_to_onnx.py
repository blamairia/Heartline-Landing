#!/usr/bin/env python3
"""
Convert PyTorch ResNet34 model to ONNX format for deployment.
This script should be run once to convert your existing model.
"""

import torch
import numpy as np
from resnet import resnet34
import os

def convert_model_to_onnx():
    """Convert the PyTorch model to ONNX format"""
    
    # Model paths
    pytorch_model_path = "resnet34_model.pth"
    onnx_model_path = "resnet34_model.onnx"
    
    if not os.path.exists(pytorch_model_path):
        print(f"Error: PyTorch model not found at {pytorch_model_path}")
        return False
    
    try:
        # Load the PyTorch model
        print("Loading PyTorch model...")
        model = resnet34(input_channels=12, num_classes=9)
        state_dict = torch.load(pytorch_model_path, map_location='cpu')
        model.load_state_dict(state_dict)
        model.eval()
        
        # Create dummy input for tracing
        dummy_input = torch.randn(1, 12, 15000)
        
        # Export to ONNX
        print("Converting to ONNX...")
        torch.onnx.export(
            model,
            dummy_input,
            onnx_model_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['ecg_signal'],
            output_names=['predictions'],
            dynamic_axes={
                'ecg_signal': {0: 'batch_size'},
                'predictions': {0: 'batch_size'}
            }
        )
        
        print(f"Model successfully converted to {onnx_model_path}")
        
        # Verify the conversion
        import onnxruntime as ort
        
        # Test the ONNX model
        ort_session = ort.InferenceSession(onnx_model_path)
        ort_inputs = {ort_session.get_inputs()[0].name: dummy_input.numpy()}
        ort_outputs = ort_session.run(None, ort_inputs)
        
        # Compare with PyTorch output
        with torch.no_grad():
            pytorch_output = model(dummy_input)
        
        # Check if outputs are close
        np.testing.assert_allclose(
            pytorch_output.numpy(), 
            ort_outputs[0], 
            rtol=1e-3, 
            atol=1e-5
        )
        
        print("✅ ONNX model verification successful!")
        print(f"PyTorch output shape: {pytorch_output.shape}")
        print(f"ONNX output shape: {ort_outputs[0].shape}")
        
        return True
        
    except Exception as e:
        print(f"Error during conversion: {e}")
        return False

if __name__ == "__main__":
    success = convert_model_to_onnx()
    if success:
        print("\nNext steps:")
        print("1. Install onnxruntime: pip install onnxruntime")
        print("2. Update your app.py to use the ONNX model")
        print("3. Remove torch from requirements.txt")
    else:
        print("Conversion failed. Please check the error messages above.")