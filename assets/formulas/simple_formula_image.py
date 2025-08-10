from PIL import Image, ImageDraw, ImageFont
import os

# Create a new image with a dark background
width, height = 1200, 800
image = Image.new('RGB', (width, height), color='black')
draw = ImageDraw.Draw(image)

# Try to use a system font, fallback to default if not available
try:
    # Try to find a good font
    font_large = ImageFont.truetype("arial.ttf", 24)
    font_medium = ImageFont.truetype("arial.ttf", 18)
    font_small = ImageFont.truetype("arial.ttf", 14)
    font_tiny = ImageFont.truetype("arial.ttf", 12)
except:
    # Fallback to default font
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_tiny = ImageFont.load_default()

# Colors
title_color = (0, 255, 136)  # Green
formula_color = (0, 255, 255)  # Cyan
variable_color = (255, 170, 0)  # Orange
category_color = (255, 255, 255)  # White
text_color = (200, 200, 200)  # Light gray

# Title
draw.text((width//2, 30), "VIRIDIAN FOOTBALL ENGINE", font=font_large, fill=title_color, anchor="mm")
draw.text((width//2, 60), "Comprehensive Blocker-Defender Engagement Formula", font=font_medium, fill=category_color, anchor="mm")

# Main formula
main_formula = "P(engagement) = σ(α₀ + α₁·L + α₂·Δm + α₃·Δp + α₄·s_b + α₅·s_m + α₆·f_f + α₇·i_r) × c_m"
draw.text((width//2, 100), main_formula, font=font_medium, fill=formula_color, anchor="mm")

# Leverage formula
leverage_formula = "L = w₁·p_n + w₂·y_a + w₃·f_s + w₄·a_c + s_m"
draw.text((width//2, 130), leverage_formula, font=font_small, fill=variable_color, anchor="mm")

# Component formulas
components = [
    "p_n = clamp((p_l - 80)/80, 0, 1)",
    "y_a = 1 - |y_h|/180",
    "f_s = 1 - (s_w - 0.5)²/0.25",
    "a_c = cos(a_a × π/180)",
    "Δm = (m_b - m_d)/50",
    "Δp = (p_b - p_d)/500",
    "E_c = 0.5 × (m_b + m_d) × v_r² × cos(θ_i × π/180)"
]

y_pos = 170
for comp in components:
    draw.text((width//2, y_pos), comp, font=font_small, fill=text_color, anchor="mm")
    y_pos += 25

# Variable categories
categories = [
    ("PHYSICAL VARIABLES", 320, (255, 136, 136)),
    ("PHYSIOLOGICAL VARIABLES", 420, (136, 255, 136)),
    ("ENVIRONMENTAL VARIABLES", 520, (136, 136, 255)),
    ("CONSTANTS", 620, (255, 255, 136))
]

for title, y_pos, color in categories:
    draw.text((width//2, y_pos), title, font=font_small, fill=color, anchor="mm")

# Physical variables
physical_vars = [
    "m_b, m_d: Blocker/Defender mass (kg)",
    "p_b, p_d: Blocker/Defender momentum (kg·m/s)",
    "v_r: Relative velocity (m/s)",
    "θ_i: Impact angle (degrees)",
    "p_l: Pad level (cm)",
    "y_h: Hip yaw angle (degrees)",
    "s_w: Stance width (m)"
]

y_pos = 350
for var in physical_vars:
    draw.text((width//2, y_pos), var, font=font_tiny, fill=text_color, anchor="mm")
    y_pos += 20

# Physiological variables
physio_vars = [
    "f_a,b, f_a,d: Acute fatigue [0,1]",
    "f_c,b, f_c,d: Cumulative fatigue [0,1]",
    "h_u: Unsafe head position (binary)",
    "t_l: Twist load (N·m·deg/s)"
]

y_pos = 450
for var in physio_vars:
    draw.text((width//2, y_pos), var, font=font_tiny, fill=text_color, anchor="mm")
    y_pos += 20

# Environmental variables
env_vars = [
    "s_c: Surface condition multiplier",
    "w_f: Weather factor",
    "f_z: Field zone factor",
    "t_l: Trust level",
    "e_f: Experience factor"
]

y_pos = 550
for var in env_vars:
    draw.text((width//2, y_pos), var, font=font_tiny, fill=text_color, anchor="mm")
    y_pos += 20

# Constants
constants = [
    "α₀ = -0.5, α₁ = 2.0, α₂ = 0.1, α₃ = 0.05",
    "α₄ = 0.8, α₅ = 0.6, α₆ = -0.4, α₇ = -0.2",
    "w₁ = 0.30, w₂ = 0.25, w₃ = 0.25, w₄ = 0.20"
]

y_pos = 650
for const in constants:
    draw.text((width//2, y_pos), const, font=font_tiny, fill=text_color, anchor="mm")
    y_pos += 20

# Add border
draw.rectangle([(10, 10), (width-10, height-10)], outline=title_color, width=3)

# Add watermark
draw.text((20, height-30), "USE ENGINE v1.0", font=font_tiny, fill=title_color)

# Save the image
image.save('engagement_formula_simple.png')
print("Simple formula image created: engagement_formula_simple.png")
