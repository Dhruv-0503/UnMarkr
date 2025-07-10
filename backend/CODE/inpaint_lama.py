# inpaint_lama.py
import os
import sys
import cv2
import torch
import numpy as np
import argparse
from omegaconf import OmegaConf

lama_root = os.path.join(os.path.dirname(__file__), '..', 'lama')
sys.path.insert(0, lama_root)

from saicinpainting.evaluation.utils import move_to_device
from saicinpainting.evaluation.refinement import refine_predict
from saicinpainting.training.trainers import load_checkpoint

from collections import defaultdict
from omegaconf.dictconfig import DictConfig
from omegaconf.base import ContainerMetadata
from omegaconf.nodes import AnyNode
from omegaconf.base import Metadata
import pytorch_lightning.callbacks.model_checkpoint

torch.serialization.add_safe_globals([
    pytorch_lightning.callbacks.model_checkpoint.ModelCheckpoint,
    DictConfig,
    ContainerMetadata,
    Metadata,
    dict,
    defaultdict,
    AnyNode
])


def load_lama_model(config_path, checkpoint_path, device='cuda' if torch.cuda.is_available() else 'cpu'):
    config = OmegaConf.load(config_path)
    config.training_model.predict_only = True
    config.visualizer.kind = 'noop'

    model = load_checkpoint(config, checkpoint_path, strict=False, map_location=device)
    model.freeze()
    model.to(device)
    return model, device


def inpaint_image(image_path, mask_path, model, device):
    image = cv2.imread(image_path)[:, :, ::-1].copy()
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

    image_tensor = torch.from_numpy(image).float().permute(2, 0, 1).unsqueeze(0) / 255.0
    mask_tensor = torch.from_numpy(mask).float().unsqueeze(0).unsqueeze(0) / 255.0

    batch = {
        'image': image_tensor,
        'mask': mask_tensor,
        'unpad_to_size': torch.tensor([[image.shape[0], image.shape[1]]])
    }

    gpu_ids = ""

    result = refine_predict(
        batch=batch,
        inpainter=model,
        gpu_ids=gpu_ids,
        modulo=8,
        n_iters=5,
        lr=0.01,
        min_side=256,
        max_scales=3,
        px_budget=1024 * 1024
    )

    inpainted = result[0].permute(1, 2, 0).numpy() * 255.0
    return inpainted.astype(np.uint8)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_path', type=str, required=True, help='Path to big-lama model folder')
    parser.add_argument('--image_folder', type=str, required=True, help='Path to input image folder')
    parser.add_argument('--mask_folder', type=str, required=True, help='Path to input mask folder')
    parser.add_argument('--output_folder', type=str, required=True, help='Path to save inpainted output')

    args = parser.parse_args()

    config_path = os.path.join(args.model_path, 'config.yaml')
    checkpoint_path = os.path.join(args.model_path, 'models', 'best.ckpt')

    os.makedirs(args.output_folder, exist_ok=True)

    model, device = load_lama_model(config_path, checkpoint_path)

    for filename in os.listdir(args.image_folder):
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue

        image_path = os.path.join(args.image_folder, filename)
        mask_path = os.path.join(args.mask_folder, os.path.splitext(filename)[0] + '.png')

        if not os.path.exists(mask_path):
            print(f"Skipping {filename}: Mask not found.")
            continue

        result = inpaint_image(image_path, mask_path, model, device)
        out_path = os.path.join(args.output_folder, filename)
        cv2.imwrite(out_path, result[:, :, ::-1])  # RGB to BGR
        print(f"Inpainted saved: {out_path}")
