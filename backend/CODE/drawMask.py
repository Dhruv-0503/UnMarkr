import os
import cv2
import argparse
import numpy as np

def parse_coordinates(txt_path):
    boxes = []
    with open(txt_path, 'r') as f:
        for line in f:
            if ',' in line:
                coords = list(map(int, map(float, line.strip().split(',')[:8])))
                box = np.array(coords, dtype=np.int32).reshape((-1, 1, 2))
                boxes.append(box)
    return boxes

def create_mask(image_shape, boxes, radius=0):
    mask = np.zeros(image_shape[:2], dtype=np.uint8)
    for box in boxes:
        cv2.fillPoly(mask, [box], 255)
    if radius > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (radius, radius))
        mask = cv2.dilate(mask, kernel, iterations=1)
    return mask

def main(args):
    os.makedirs(args.output_folder, exist_ok=True)

    image_files = os.listdir(args.input_folder)
    for image_file in image_files:
        if not image_file.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue

        image_path = os.path.join(args.input_folder, image_file)
        txt_name = os.path.splitext(image_file)[0] + '.txt'
        txt_path = os.path.join(args.coor_folder, txt_name)

        if not os.path.exists(txt_path):
            print(f"Skipping {image_file}: No coordinate file found.")
            continue

        image = cv2.imread(image_path)
        boxes = parse_coordinates(txt_path)
        mask = create_mask(image.shape, boxes, radius=args.radius)

        mask_path = os.path.join(args.output_folder, os.path.splitext(image_file)[0] + '.png')
        cv2.imwrite(mask_path, mask)
        print(f"Mask Saved!!")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--coor_folder', type=str, required=True,
                        help='Folder containing CRAFT coordinate .txt files')
    parser.add_argument('--input_folder', type=str, required=True,
                        help='Folder containing input images')
    parser.add_argument('--output_folder', type=str, required=True,
                        help='Folder to save generated binary masks')
    parser.add_argument('--radius', type=int, default=0,
                        help='Dilation radius to expand mask area')

    args = parser.parse_args()
    main(args)
