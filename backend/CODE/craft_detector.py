import os
import sys
import argparse
import numpy as np
import torch
from collections import OrderedDict

# Add CRAFT directory to Python path
craft_dir = os.path.join(os.path.dirname(__file__), '..', 'CRAFT')
sys.path.append(craft_dir)

from craft import CRAFT
import imgproc
import craft_utils

def copyStateDict(state_dict):
    if list(state_dict.keys())[0].startswith("module"):
        start_idx = 1
    else:
        start_idx = 0
    new_state_dict = OrderedDict()
    for k, v in state_dict.items():
        name = ".".join(k.split(".")[start_idx:])
        new_state_dict[name] = v
    return new_state_dict

def load_craft_model(model_path):
    """Load the pre-trained CRAFT model."""
    net = CRAFT()
    print("Loading CRAFT model from:", model_path)
    net.load_state_dict(copyStateDict(torch.load(model_path, map_location='cpu')))
    net.eval()
    return net

def detect_text(net, image_path, text_threshold=0.7, low_text=0.4, link_threshold=0.4, canvas_size=1280, mag_ratio=1.5):
    """
    Detect text regions in an image using the CRAFT model.
    """
    # Load image
    image = imgproc.loadImage(image_path)

    # Resize image
    img_resized, target_ratio, _ = imgproc.resize_aspect_ratio(
        image, canvas_size, interpolation=cv2.INTER_LINEAR, mag_ratio=mag_ratio
    )
    ratio_h = ratio_w = 1 / target_ratio

    # Preprocessing
    x = imgproc.normalizeMeanVariance(img_resized)
    x = torch.from_numpy(x).permute(2, 0, 1)  # [h, w, c] to [c, h, w]
    x = x.unsqueeze(0)  # [c, h, w] to [b, c, h, w]

    # Forward pass
    with torch.no_grad():
        y, _ = net(x)

    # Extract score maps
    score_text = y[0, :, :, 0].cpu().data.numpy()
    score_link = y[0, :, :, 1].cpu().data.numpy()

    # Post-processing to get bounding boxes
    boxes, _ = craft_utils.getDetBoxes(
        score_text, score_link, text_threshold, link_threshold, low_text, poly=True
    )

    # Adjust coordinates
    boxes = craft_utils.adjustResultCoordinates(boxes, ratio_w, ratio_h)

    # Format for GaRNet (x1,y1,x2,y2,x3,y3,x4,y4)
    garnet_boxes = []
    for box in boxes:
        # Ensure box has 4 points
        if len(box) == 4:
            # Flatten the points and format as integers
            formatted_box = ",".join([str(int(coord)) for point in box for coord in point])
            garnet_boxes.append(formatted_box)

    return garnet_boxes

def save_to_txt(boxes, output_path):
    """Save the detected bounding boxes to a .txt file."""
    with open(output_path, 'w', encoding='utf-8') as f:
        for box in boxes:
            f.write(box + '\n')
    print(f"Saved {len(boxes)} text regions to: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="CRAFT Text Detection for GaRNet")
    parser.add_argument("--image_path", type=str, required=True, help="Path to the input image.")
    parser.add_argument("--output_path", type=str, help="Path to save the output .txt file. Defaults to same name as image.")
    parser.add_argument("--model_path", type=str, default="../CRAFT/craft_mlt_25k.pth", help="Path to the pre-trained CRAFT model.")

    args = parser.parse_args()

    # Set default output path if not provided
    if not args.output_path:
        img_name = os.path.splitext(os.path.basename(args.image_path))[0]
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'INPUT', 'TXT'))
        os.makedirs(output_dir, exist_ok=True)
        args.output_path = os.path.join(output_dir, f"{img_name}.txt")


    # Load model
    net = load_craft_model(args.model_path)

    # Detect text
    detected_boxes = detect_text(net, args.image_path)

    # Save results
    save_to_txt(detected_boxes, args.output_path)

if __name__ == "__main__":
    # Workaround for OpenCV issue with argument parsing
    import cv2
    main() 