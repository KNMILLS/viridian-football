from PIL import Image, ImageDraw, ImageFont
import os

# Create a new image with a dark background
width, height = 1600, 1200
image = Image.new('RGB', (width, height), color='black')
draw = ImageDraw.Draw(image)

# Try to use a system font, fallback to default if not available
try:
    font_large = ImageFont.truetype("arial.ttf", 28)
    font_medium = ImageFont.truetype("arial.ttf", 20)
    font_small = ImageFont.truetype("arial.ttf", 16)
    font_tiny = ImageFont.truetype("arial.ttf", 14)
    font_code = ImageFont.truetype("consola.ttf", 14)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_tiny = ImageFont.load_default()
    font_code = ImageFont.load_default()

# Colors
title_color = (0, 255, 136)  # Green
step_color = (0, 255, 255)   # Cyan
input_color = (255, 170, 0)  # Orange
output_color = (255, 136, 136)  # Red
calc_color = (136, 255, 136)  # Green
text_color = (200, 200, 200)  # Light gray

def draw_rounded_rect(draw, x1, y1, x2, y2, color, text, font, text_color=(255,255,255)):
    """Draw a rounded rectangle with text"""
    # Draw rectangle
    draw.rectangle([x1, y1, x2, y2], outline=color, width=2, fill=(20, 20, 20))
    # Draw text
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    text_x = x1 + (x2 - x1 - text_width) // 2
    text_y = y1 + (y2 - y1 - text_height) // 2
    draw.text((text_x, text_y), text, font=font, fill=text_color)

def draw_arrow(draw, x1, y1, x2, y2, color):
    """Draw an arrow from (x1,y1) to (x2,y2)"""
    draw.line([x1, y1, x2, y2], fill=color, width=2)
    # Draw arrowhead
    if x2 > x1:  # Right arrow
        draw.polygon([x2, y2, x2-10, y2-5, x2-10, y2+5], fill=color)
    elif x2 < x1:  # Left arrow
        draw.polygon([x2, y2, x2+10, y2-5, x2+10, y2+5], fill=color)
    elif y2 > y1:  # Down arrow
        draw.polygon([x2, y2, x2-5, y2-10, x2+5, y2-10], fill=color)
    else:  # Up arrow
        draw.polygon([x2, y2, x2-5, y2+10, x2+5, y2+10], fill=color)

# Title
draw.text((width//2, 30), "VIRIDIAN FOOTBALL ENGINE", font=font_large, fill=title_color, anchor="mm")
draw.text((width//2, 70), "Blocker-Defender Engagement Algorithm Flow", font=font_medium, fill=text_color, anchor="mm")

# Step 1: Input Collection
draw_rounded_rect(draw, 50, 120, 350, 200, input_color, "STEP 1:\nCollect Input Data", font_medium, input_color)
input_data = [
    "• Player masses & momentum",
    "• Body positions & angles", 
    "• Fatigue levels",
    "• Field position & context",
    "• Environmental factors"
]
y_pos = 140
for data in input_data:
    draw.text((70, y_pos), data, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Step 2: Leverage Calculation
draw_rounded_rect(draw, 450, 120, 750, 200, calc_color, "STEP 2:\nCalculate Leverage", font_medium, calc_color)
leverage_data = [
    "• Pad level normalization",
    "• Hip alignment factor",
    "• Foot stability",
    "• Approach angle",
    "• State modifiers"
]
y_pos = 140
for data in leverage_data:
    draw.text((470, y_pos), data, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Step 3: Physics Calculations
draw_rounded_rect(draw, 850, 120, 1150, 200, calc_color, "STEP 3:\nPhysics Factors", font_medium, calc_color)
physics_data = [
    "• Mass difference",
    "• Momentum difference", 
    "• Collision energy",
    "• Impact angle effects"
]
y_pos = 140
for data in physics_data:
    draw.text((870, y_pos), data, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Step 4: Context Analysis
draw_rounded_rect(draw, 1250, 120, 1550, 200, calc_color, "STEP 4:\nSpatial Context", font_medium, calc_color)
context_data = [
    "• Sideline proximity",
    "• Field zone analysis",
    "• Pursuit density",
    "• Environmental factors"
]
y_pos = 140
for data in context_data:
    draw.text((1270, y_pos), data, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Arrows from Step 1
draw_arrow(draw, 200, 200, 450, 160, step_color)
draw_arrow(draw, 200, 200, 850, 160, step_color)
draw_arrow(draw, 200, 200, 1250, 160, step_color)

# Step 5: Combine Factors
draw_rounded_rect(draw, 450, 280, 1150, 360, step_color, "STEP 5:\nCombine All Factors", font_medium, step_color)
combine_data = [
    "engagement_probability = sigmoid(intercept + leverage_coeff * leverage +",
    "                                mass_coeff * mass_diff + momentum_coeff * momentum_diff +",
    "                                sideline_coeff * sideline_benefit + spatial_coeff * spatial_modifier +",
    "                                fatigue_coeff * fatigue_factor + injury_coeff * injury_risk) * context_multiplier"
]
y_pos = 300
for data in combine_data:
    draw.text((470, y_pos), data, font=font_code, fill=text_color, anchor="lm")
    y_pos += 20

# Arrows to Step 5
draw_arrow(draw, 600, 200, 600, 280, step_color)
draw_arrow(draw, 1000, 200, 800, 280, step_color)
draw_arrow(draw, 1400, 200, 1000, 280, step_color)

# Step 6: Apply Modifiers
draw_rounded_rect(draw, 450, 420, 1150, 500, calc_color, "STEP 6:\nApply Final Modifiers", font_medium, calc_color)
modifier_data = [
    "• Fatigue effects (acute & cumulative)",
    "• Injury risk assessment",
    "• Trust & experience factors",
    "• Surface & weather conditions"
]
y_pos = 440
for data in modifier_data:
    draw.text((470, y_pos), data, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Arrow to Step 6
draw_arrow(draw, 800, 360, 800, 420, step_color)

# Step 7: Final Result
draw_rounded_rect(draw, 450, 560, 1150, 640, output_color, "STEP 7:\nEngagement Outcome", font_medium, output_color)
result_data = [
    "• Success probability [0,1]",
    "• Collision energy calculation",
    "• Fatigue impact on both players",
    "• Injury risk assessment",
    "• Body state updates"
]
y_pos = 580
for data in result_data:
    draw.text((470, y_pos), data, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Arrow to Step 7
draw_arrow(draw, 800, 500, 800, 560, step_color)

# Key Variables Panel
draw_rounded_rect(draw, 50, 700, 750, 1000, title_color, "KEY VARIABLES", font_medium, title_color)

# Physical Variables
draw.text((70, 740), "PHYSICAL VARIABLES:", font=font_small, fill=input_color, anchor="lm")
physical_vars = [
    "• blocker.mass, defender.mass (kg)",
    "• blocker.momentum, defender.momentum (kg·m/s)",
    "• relative_velocity (m/s)",
    "• impact_angle (degrees)",
    "• pad_level (cm)",
    "• hip_yaw_angle (degrees)",
    "• stance_width (m)"
]
y_pos = 770
for var in physical_vars:
    draw.text((70, y_pos), var, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 18

# Physiological Variables
draw.text((70, 880), "PHYSIOLOGICAL VARIABLES:", font=font_small, fill=calc_color, anchor="lm")
physio_vars = [
    "• blocker.fatigue_acute, defender.fatigue_acute [0,1]",
    "• blocker.fatigue_cumulative, defender.fatigue_cumulative [0,1]",
    "• head_position_safe (boolean)",
    "• twist_load (N·m·deg/s)"
]
y_pos = 910
for var in physio_vars:
    draw.text((70, y_pos), var, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 18

# Environmental Variables
draw.text((70, 980), "ENVIRONMENTAL VARIABLES:", font=font_small, fill=step_color, anchor="lm")
env_vars = [
    "• surface_condition (multiplier)",
    "• weather_factor (multiplier)",
    "• field_zone (position factor)",
    "• trust_level (relationship)",
    "• experience_factor (bonus)"
]
y_pos = 1010
for var in env_vars:
    draw.text((70, y_pos), var, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 18

# Constants Panel
draw_rounded_rect(draw, 800, 700, 1550, 1000, title_color, "KEY CONSTANTS", font_medium, title_color)

# Main Coefficients
draw.text((820, 740), "MAIN COEFFICIENTS:", font=font_small, fill=input_color, anchor="lm")
main_constants = [
    "• intercept = -0.5",
    "• leverage_coeff = 2.0",
    "• mass_coeff = 0.1",
    "• momentum_coeff = 0.05",
    "• sideline_coeff = 0.8",
    "• spatial_coeff = 0.6",
    "• fatigue_coeff = -0.4",
    "• injury_coeff = -0.2"
]
y_pos = 770
for const in main_constants:
    draw.text((820, y_pos), const, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 18

# Leverage Weights
draw.text((820, 880), "LEVERAGE WEIGHTS:", font=font_small, fill=calc_color, anchor="lm")
leverage_constants = [
    "• pad_weight = 0.30",
    "• yaw_weight = 0.25",
    "• stance_weight = 0.25",
    "• approach_weight = 0.20"
]
y_pos = 910
for const in leverage_constants:
    draw.text((820, y_pos), const, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 18

# Add border
draw.rectangle([(10, 10), (width-10, height-10)], outline=title_color, width=3)

# Add watermark
draw.text((20, height-30), "USE ENGINE v1.0 - Flowchart Implementation", font=font_tiny, fill=title_color)

# Save the image
image.save('engagement_formula_flowchart.png')
print("Flowchart formula image created: engagement_formula_flowchart.png")
