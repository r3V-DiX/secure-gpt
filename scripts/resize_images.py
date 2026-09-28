import os
from PIL import Image

def resize_screenshot(input_path, output_path, target_width=1280, target_height=800):
    """
    Resizes a screenshot to exactly target_width x target_height.
    Maintains aspect ratio and pads with the border color (top-left pixel) to look seamless.
    """
    img = Image.open(input_path)
    img_w, img_h = img.size
    
    # Calculate scale factor to fit within target dimensions
    scale = min(target_width / img_w, target_height / img_h)
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    
    # Resize the image using high-quality resampling
    resized_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Get border color from top-left pixel of original image (default to white/transparent if fails)
    try:
        border_color = img.getpixel((0, 0))
    except Exception:
        border_color = (255, 255, 255, 255) if img.mode == 'RGBA' else (255, 255, 255)
        
    # Create background canvas
    new_img = Image.new(img.mode, (target_width, target_height), border_color)
    
    # Center the resized image on the background
    offset_x = (target_width - new_w) // 2
    offset_y = (target_height - new_h) // 2
    new_img.paste(resized_img, (offset_x, offset_y))
    
    # Save the result
    new_img.save(output_path, "PNG")
    print(f"Resized: {os.path.basename(input_path)} ({img_w}x{img_h}) -> {os.path.basename(output_path)} ({target_width}x{target_height}) using border color {border_color}")

def main():
    input_dir = "images"
    output_dir = "store-assets"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    images_to_resize = [
        "popup.png",
        "blocked_1.png",
        "blocked_2.png",
        "mask.png",
        "dashboard_logs.png"
    ]
    
    for img_name in images_to_resize:
        input_path = os.path.join(input_dir, img_name)
        output_path = os.path.join(output_dir, img_name)
        if os.path.exists(input_path):
            resize_screenshot(input_path, output_path)
        else:
            print(f"Warning: {input_path} does not exist.")

if __name__ == "__main__":
    main()
