from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import subprocess
import sys
import shutil

from PIL import Image
import io
import json
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
INPUT_IMG_FOLDER = 'INPUT/IMG'
INPUT_TXT_FOLDER = 'INPUT/TXT'
INPUT_MASK_FOLDER = 'INPUT/MASK'
OUTPUT_IMG_FOLDER = 'OUTPUT/IMG'
OUTPUT_COR_FOLDER = 'OUTPUT/COR'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Create all necessary folders (removed UPLOAD_FOLDER)
for folder in [INPUT_IMG_FOLDER, INPUT_TXT_FOLDER, INPUT_MASK_FOLDER, OUTPUT_IMG_FOLDER, OUTPUT_COR_FOLDER]:
    os.makedirs(folder, exist_ok=True)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_folders():
    """Clean up all INPUT and OUTPUT folders after processing"""
    try:
        folders_to_clean = [
            INPUT_IMG_FOLDER,
            INPUT_TXT_FOLDER, 
            INPUT_MASK_FOLDER,
            OUTPUT_IMG_FOLDER,
            OUTPUT_COR_FOLDER
        ]
        
        for folder in folders_to_clean:
            if os.path.exists(folder):
                # Remove all files in the folder
                for filename in os.listdir(folder):
                    file_path = os.path.join(folder, filename)
                    try:
                        if os.path.isfile(file_path):
                            os.unlink(file_path)
                        elif os.path.isdir(file_path):
                            shutil.rmtree(file_path)
                    except Exception as e:
                        print(f"Error deleting {file_path}: {e}")
        
        print("All processing folders cleaned successfully")
        return True
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        return False

def run_python_script(script_path, args):
    """Run a Python script with given arguments"""
    try:
        cmd = [sys.executable, script_path] + args
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=os.path.dirname(os.path.abspath(__file__)))
        
        if result.returncode != 0:
            print(f"Error running {script_path}:")
            """ print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}") """
            return False, result.stderr
        
        print(f"Successfully ran {script_path}")
        """ print(f"STDOUT: {result.stdout}") """
        return True, result.stdout
        
    except Exception as e:
        print(f"Exception running {script_path}: {str(e)}")
        return False, str(e)

def process_text_removal_pipeline(image_data):
    """Execute the complete text removal pipeline using image data directly"""
    temp_file = None
    try:
        # Step 1: Save image as testImg.jpg in INPUT/IMG folder
        test_img_path = os.path.join(INPUT_IMG_FOLDER, 'testImg.jpg')
        
        # Open image from bytes and save as JPG
        with Image.open(io.BytesIO(image_data)) as img:
            # Convert to RGB if necessary and save as JPG
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(test_img_path, 'JPEG', quality=95)
        print(f"Step 1: Image saved as {test_img_path}")
        
        # Step 2: Run CRAFT text detection
        craft_script = os.path.join('CODE', 'craft_detector.py')
        craft_args = [
            '--image_path', test_img_path,
            '--model_path', 'CRAFT/craft_mlt_25k.pth'
        ]
        success, output = run_python_script(craft_script, craft_args)
        if not success:
            return False, f"CRAFT detection failed: {output}"
        print("Step 2: CRAFT text detection completed")
        
        # Step 3: Generate masks
        draw_mask_script = os.path.join('CODE', 'drawMask.py')
        draw_mask_args = [
            '--coor_folder', INPUT_TXT_FOLDER,
            '--input_folder', INPUT_IMG_FOLDER,
            '--output_folder', INPUT_MASK_FOLDER,
            '--radius', '5'
        ]
        success, output = run_python_script(draw_mask_script, draw_mask_args)
        if not success:
            return False, f"Mask generation failed: {output}"
        print("Step 3: Mask generation completed")
        
        # Step 4: Run LaMa inpainting
        inpaint_script = os.path.join('CODE', 'inpaint_lama.py')
        inpaint_args = [
            '--model_path', 'lama/big-lama',
            '--image_folder', INPUT_IMG_FOLDER,
            '--mask_folder', INPUT_MASK_FOLDER,
            '--output_folder', OUTPUT_IMG_FOLDER
        ]
        success, output = run_python_script(inpaint_script, inpaint_args)
        if not success:
            return False, f"LaMa inpainting failed: {output}"
        print("Step 4: LaMa inpainting completed")
        
        # Step 5: Extract text with coordinates
        extract_script = os.path.join('CODE', 'extract_text.py')
        extract_args = [
            '--image_path', test_img_path,
            '--coor_path', os.path.join(INPUT_TXT_FOLDER, 'testImg.txt'),
            '--output_path', os.path.join(OUTPUT_COR_FOLDER, 'testImg_Cor.txt')
        ]
        success, output = run_python_script(extract_script, extract_args)
        if not success:
            return False, f"Text extraction failed: {output}"
        print("Step 5: Text extraction completed")
        
        return True, "Pipeline completed successfully"
        
    except Exception as e:
        return False, f"Pipeline error: {str(e)}"

@app.route('/upload', methods=['POST'])
def upload_image():
    """Endpoint to receive image files from frontend and process text removal"""
    try:
        # Check if image file is present in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Read the file data directly into memory
        image_data = file.read()
        
        # Process the text removal pipeline directly from memory
        success, message = process_text_removal_pipeline(image_data)
        
        if not success:
            # Clean up even if processing failed
            cleanup_folders()
            return jsonify({'error': f'Processing failed: {message}'}), 500
        
        # Step 6: Return the processed results
        try:
            # Read the cleaned image
            cleaned_image_path = os.path.join(OUTPUT_IMG_FOLDER, 'testImg.jpg')
            if not os.path.exists(cleaned_image_path):
                cleanup_folders()
                return jsonify({'error': 'Cleaned image not found'}), 500
            
            with open(cleaned_image_path, 'rb') as img_file:
                cleaned_image_data = img_file.read()
                cleaned_image_base64 = base64.b64encode(cleaned_image_data).decode('utf-8')
            
            # Read the text coordinates file
            text_coords_path = os.path.join(OUTPUT_COR_FOLDER, 'testImg_Cor.txt')
            text_coords = []
            if os.path.exists(text_coords_path):
                with open(text_coords_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            parts = line.split(',')
                            if len(parts) >= 9:  # 8 coordinates + text
                                coords = [int(parts[i]) for i in range(8)]
                                text = ','.join(parts[8:])  # text might contain commas
                                text_coords.append({
                                    'coordinates': coords,
                                    'text': text
                                })
            
            # Get image dimensions
            with Image.open(cleaned_image_path) as img:
                width, height = img.size
            
            # Prepare response
            response_data = {
                'message': 'Text removal completed successfully',
                'cleaned_image': cleaned_image_base64,
                'text_coordinates': text_coords,
                'width': width,
                'height': height,
                'file_size': len(cleaned_image_data)
            }
            
            # Clean up all processing folders after preparing response
            cleanup_folders()
            
            return jsonify(response_data), 200
            
        except Exception as e:
            # Clean up on error
            cleanup_folders()
            return jsonify({'error': f'Error reading results: {str(e)}'}), 500
        
    except Exception as e:
        # Clean up on any exception
        cleanup_folders()
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Server is running'}), 200



if __name__ == '__main__':
    print("Starting Flask server with text removal pipeline...")
    print("Server will be available at: http://localhost:5000")
    print("Upload endpoint: http://localhost:5000/upload")
    print("Health check: http://localhost:5000/health")
    app.run(debug=True, host='0.0.0.0', port=5000) 