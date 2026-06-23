import os
from PIL import Image, ImageDraw

def create_icon(size, filename):
    # Create a simple red square with a white "S" for Sentiment
    image = Image.new('RGB', (size, size), color = '#ff0000')
    draw = ImageDraw.Draw(image)
    
    # Just draw a simple circle for the icon
    padding = size // 8
    draw.ellipse([padding, padding, size - padding, size - padding], fill='#ffffff')
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    image.save(filename)
    print(f"Created {filename}")

icons_dir = r"c:\Users\Ayushi\Projects\YT comment sentiment plugin\chrome_extension\icons"
create_icon(16, os.path.join(icons_dir, "icon16.png"))
create_icon(48, os.path.join(icons_dir, "icon48.png"))
create_icon(128, os.path.join(icons_dir, "icon128.png"))
