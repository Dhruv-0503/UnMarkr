# UnMarkr | [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@dhruvpatel0503)

A modern fullstack application that lets you turn any text in an image into editable text overlays—so you can change, add, or remove text while keeping the background consistent. It uses advanced methods of Text Detection and Inpainting, UnMarkr makes image text as easy to edit as a design file.

---

## 🚀 Project Overview
UnMarkr is a web app that empowers you to:
- Upload images with text (e.g., posters, flyers, memes, screenshots)
- Automatically detect and remove text, seamlessly filling the background
- Instantly convert detected text into editable overlays
- Change, add, or remove text directly on the image—just like in a design tool
- Download your new, customized image with all edits applied

---

## ✨ Features
- **Editable Text Overlays:** Detected text becomes editable overlays you can modify, move, resize, or restyle
- **Text Removal & Inpainting:** Removes original text and fills the background using CRAFT and LaMa deep learning models
- **Add/Change Text:** Add new text or change existing text anywhere on the image
- **Custom Overlays:** Add, edit, and style shapes (rectangle, ellipse, line) and emojis
- **Drag & Resize:** Move and resize overlays with a Canva-like interface
- **Smart Guides:** Alignment guides for precise placement
- **Layer Control:** Change overlay stacking order (bring forward/back)
- **Download:** Export your final, edited image as PNG

---

## ⚙️ Setup Instructions

### 1. Backend (Python)
- Python 3.8+
- Recommended: Create a virtual environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Download or place model weights as needed (see backend/CRAFT and backend/lama)
python app.py
```
- The backend will run on `http://localhost:5000` by default.

### 2. Frontend (React)
- Node.js 16+

```bash
cd frontend
npm install
npm run dev
```
- The frontend will run on `http://localhost:5173` by default.

---

## 🖼️ Usage
1. Open the frontend in your browser.
2. Upload an image with text.
3. Click "Remove Text"—the app will detect and erase text, then create editable overlays for each region.
4. Click on any overlay to edit the text, change its style, or move/resize it. Add new text, shapes, or emojis as needed.
5. Use the toolbar to style overlays and control their layer position.
6. Download your final, customized image.

--- 

## Important Note About Running This Project

To run this code, you must have the following folders present in the `backend/` directory:
- `venv/` (your Python virtual environment)
- `CRAFT/` (CRAFT text detector files)
- `lama/` (LaMa inpainting files)

These folders are excluded from version control via `.gitignore` and will not be pushed to the repository. You must set them up manually as per the project requirements:

- **venv/**: Create a Python virtual environment in `backend/` (e.g., `python -m venv venv`).
- **CRAFT/**: Clone the CRAFT repository from [https://github.com/clovaai/CRAFT-pytorch](https://github.com/clovaai/CRAFT-pytorch) into `backend/CRAFT/`. After cloning, download the pre-trained CRAFT model weights (e.g., `craft_mlt_25k.pth`) and place them in the `backend/CRAFT/` folder. See the CRAFT repo for download links and instructions.
- **lama/**: Clone the LaMa repository from [https://github.com/saic-mdal/lama](https://github.com/saic-mdal/lama) into `backend/lama/`. After cloning, download the pre-trained LaMa model weights as instructed in the LaMa repository and place them in the appropriate subfolder (e.g., `backend/lama/big-lama/models/`).

Follow the setup instructions in each repository to ensure all dependencies and models are correctly installed. 

## Disclaimer: Inpainting Accuracy

We are actively researching and testing more accurate methods for image inpainting. The current implementation may not produce perfect results for all images—sometimes, it may leave blurred areas or residual text portions on the output image. We appreciate your understanding as we continue to improve the system. 
