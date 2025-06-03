#!/usr/bin/env python3
"""
ecg_worker.py

Subcommands:
  upload    --file1 PATH --file2 PATH --output_dir PATH
  plot      --record_id RECORD_ID --leads LEADS_JSON --overlay BOOL --style STYLE
  inference --record_id RECORD_ID

Prints JSON to stdout, exits nonzero on error.
"""

import os
import sys
import json
import argparse
import shutil
import numpy as np
import wfdb
import torch
from resnet import resnet34  # Ensure resnet34.py is on PYTHONPATH

# ❓ QUESTION: Absolute path to your resnet34_model.pth
MODEL_PATH = "D:\\doctor\\resnet34_model.pth"

# ❓ QUESTION: Must match Laravel’s storage/app/ecg_temp
BASE_UPLOAD_DIR = "D:\\doctor\\storage\\app\\ecg_temp"

_cached_model = None
_cached_device = None

def load_model():
    global _cached_model, _cached_device
    if _cached_model is None:
        device = torch.device("cuda:0") if torch.cuda.is_available() else torch.device("cpu")
        model = resnet34(input_channels=12, num_classes=9)
        state_dict = torch.load(MODEL_PATH, map_location=device)
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        _cached_model = model
        _cached_device = device
    return _cached_model, _cached_device

def cmd_upload(args):
    base1 = os.path.splitext(os.path.basename(args.file1))[0]
    base2 = os.path.splitext(os.path.basename(args.file2))[0]
    if base1 != base2:
        print(json.dumps({"error": "Basenames do not match."}))
        sys.exit(1)

    rand_suffix = np.random.randint(1_000_000)
    record_id = f"{base1}_{rand_suffix}"
    target_folder = os.path.join(args.output_dir, record_id)
    os.makedirs(target_folder, exist_ok=True)

    dest1 = os.path.join(target_folder, os.path.basename(args.file1))
    dest2 = os.path.join(target_folder, os.path.basename(args.file2))
    shutil.copyfile(args.file1, dest1)
    shutil.copyfile(args.file2, dest2)

    try:
        record = wfdb.rdrecord(os.path.join(target_folder, base1))
        lead_names = record.sig_name
        sampling_rate = getattr(record, 'fs', 500)
    except Exception as e:
        shutil.rmtree(target_folder)
        print(json.dumps({"error": f"Could not read WFDB record: {e}"}))
        sys.exit(1)

    output = {
        "record_id": record_id,
        "lead_names": lead_names,
        "sampling_rate": sampling_rate
    }
    print(json.dumps(output))

def cmd_plot(args):
    record_id = args.record_id
    folder = os.path.join(BASE_UPLOAD_DIR, record_id)
    base = record_id.split('_')[0]

    try:
        record = wfdb.rdrecord(os.path.join(folder, base))
        sig_all = record.p_signal  # [n_samples, n_leads]
        lead_names = record.sig_name
        fs = getattr(record, 'fs', 500)
        nsteps, nleads = sig_all.shape
        times = (np.arange(nsteps) / fs).tolist()
    except Exception as e:
        print(json.dumps({"error": f"Could not read WFDB record: {e}"}))
        sys.exit(1)

    requested_leads = json.loads(args.leads)
    overlay = args.overlay.lower() == 'true'

    data_out = []
    if overlay:
        indices = list(range(len(lead_names)))
    else:
        indices = [lead_names.index(l) for l in requested_leads]

    for idx in indices:
        lead = lead_names[idx]
        values = sig_all[:, idx].tolist()
        data_out.append({
            "lead": lead,
            "times": times,
            "values": values,
            "offset": 0
        })

    response = {
        "data": data_out,
        "abnormal_ranges": []
    }
    print(json.dumps(response))

def cmd_inference(args):
    record_id = args.record_id
    folder = os.path.join(BASE_UPLOAD_DIR, record_id)
    base = record_id.split('_')[0]

    try:
        record = wfdb.rdrecord(os.path.join(folder, base))
        sig_all = record.p_signal  # [n_samples, n_leads]
        nsteps, nleads = sig_all.shape
    except Exception as e:
        print(json.dumps({"error": f"Could not read WFDB record: {e}"}))
        sys.exit(1)

    if nsteps >= 15000:
        clipped = sig_all[-15000:, :]
    else:
        padded = np.zeros((15000, nleads), dtype=np.float32)
        padded[-nsteps:, :] = sig_all
        clipped = padded

    x_np = clipped.transpose().astype(np.float32)  # shape: [12, 15000]
    x_tensor = torch.from_numpy(x_np).unsqueeze(0)  # shape: [1, 12, 15000]

    model, device = load_model()
    x_tensor = x_tensor.to(device)

    with torch.no_grad():
        logits = model(x_tensor)
        probs = torch.sigmoid(logits)[0].cpu().numpy()

    class_abbrs = ["SNR","AF","IAVB","LBBB","RBBB","PAC","PVC","STD","STE"]
    prob_dict = {class_abbrs[i]: float(probs[i]) for i in range(len(class_abbrs))}

    output = {
        "probabilities": prob_dict,
        "abnormal_ranges": []
    }
    print(json.dumps(output))

def main():
    parser = argparse.ArgumentParser(description='ECG Worker CLI')
    subparsers = parser.add_subparsers(dest='command')

    upload_parser = subparsers.add_parser('upload')
    upload_parser.add_argument('--file1', required=True)
    upload_parser.add_argument('--file2', required=True)
    upload_parser.add_argument('--output_dir', required=True)

    plot_parser = subparsers.add_parser('plot')
    plot_parser.add_argument('--record_id', required=True)
    plot_parser.add_argument('--leads', required=True)
    plot_parser.add_argument('--overlay', required=True)
    plot_parser.add_argument('--style', required=True)

    inf_parser = subparsers.add_parser('inference')
    inf_parser.add_argument('--record_id', required=True)

    args = parser.parse_args()
    if args.command == 'upload':
        cmd_upload(args)
    elif args.command == 'plot':
        cmd_plot(args)
    elif args.command == 'inference':
        cmd_inference(args)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()
