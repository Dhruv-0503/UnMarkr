import cv2
import pytesseract
import os
import argparse
import numpy as np

def read_coordinates(txt_path):
    boxes = []
    with open(txt_path, 'r', encoding='utf-8') as f:
        for line in f:
            coords = list(map(int, map(float, line.strip().split(',')[:8])))
            if len(coords) == 8:
                boxes.append(coords)
    return boxes

def crop_and_ocr(image, box):
    pts = np.array(box, dtype=np.int32).reshape((4, 2))

    rect = cv2.boundingRect(pts)
    x, y, w, h = rect
    cropped = image[y:y+h, x:x+w]

    # Optional: mask region for tighter crop
    mask = np.zeros(cropped.shape[:2], dtype=np.uint8)
    pts_shifted = pts - [x, y]
    cv2.fillPoly(mask, [pts_shifted], 255)
    cropped = cv2.bitwise_and(cropped, cropped, mask=mask)

    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    text = pytesseract.image_to_string(gray, config='--psm 6').strip()

    return text if text else "NA"

def process(image_path, coor_path, output_path):
    image = cv2.imread(image_path)
    boxes = read_coordinates(coor_path)

    with open(output_path, 'w', encoding='utf-8') as f:
        for box in boxes:
            text = crop_and_ocr(image, box)
            line = ",".join(map(str, box)) + f",{text}"
            f.write(line + '\n')
    print(f"Output saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--image_path', type=str, required=True, help="Path to the input image")
    parser.add_argument('--coor_path', type=str, required=True, help="Path to the .txt file with box coordinates")
    parser.add_argument('--output_path', type=str, required=True, help="Path to save the output .txt with text")
    args = parser.parse_args()

    process(args.image_path, args.coor_path, args.output_path)
