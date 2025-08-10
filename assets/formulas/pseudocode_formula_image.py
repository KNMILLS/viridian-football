from PIL import Image, ImageDraw, ImageFont
import os

# Create a new image with a dark background
width, height = 1400, 1000
image = Image.new('RGB', (width, height), color='black')
draw = ImageDraw.Draw(image)

# Try to use a system font, fallback to default if not available
try:
    # Try to find a good font
    font_large = ImageFont.truetype("arial.ttf", 28)
    font_medium = ImageFont.truetype("arial.ttf", 20)
    font_small = ImageFont.truetype("arial.ttf", 16)
    font_tiny = ImageFont.truetype("arial.ttf", 14)
    font_code = ImageFont.truetype("consola.ttf", 14)  # Monospace for code
except:
    # Fallback to default font
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_tiny = ImageFont.load_default()
    font_code = ImageFont.load_default()

# Colors
title_color = (0, 255, 136)  # Green
formula_color = (0, 255, 255)  # Cyan
variable_color = (255, 170, 0)  # Orange
category_color = (255, 255, 255)  # White
text_color = (200, 200, 200)  # Light gray
code_color = (255, 255, 255)  # White for code
comment_color = (150, 150, 150)  # Gray for comments

# Title
draw.text((width//2, 30), "VIRIDIAN FOOTBALL ENGINE", font=font_large, fill=title_color, anchor="mm")
draw.text((width//2, 70), "Blocker-Defender Engagement Algorithm (Pseudocode)", font=font_medium, fill=category_color, anchor="mm")

# Main function
main_function = "function calculateEngagementSuccess(blocker, defender, context):"
draw.text((50, 120), main_function, font=font_medium, fill=formula_color, anchor="lm")

# Main calculation
main_calc = "    engagement_probability = sigmoid(intercept + leverage_coeff * leverage + mass_coeff * mass_diff +"
draw.text((50, 150), main_calc, font=font_code, fill=code_color, anchor="lm")
main_calc2 = "                           momentum_coeff * momentum_diff + sideline_coeff * sideline_benefit +"
draw.text((50, 175), main_calc2, font=font_code, fill=code_color, anchor="lm")
main_calc3 = "                           spatial_coeff * spatial_modifier + fatigue_coeff * fatigue_factor +"
draw.text((50, 200), main_calc3, font=font_code, fill=code_color, anchor="lm")
main_calc4 = "                           injury_coeff * injury_risk) * context_multiplier"
draw.text((50, 225), main_calc4, font=font_code, fill=code_color, anchor="lm")

# Leverage calculation
draw.text((50, 270), "    # Calculate leverage index", font=font_code, fill=comment_color, anchor="lm")
leverage_calc = "    leverage = (pad_weight * pad_normalized + yaw_weight * yaw_alignment +"
draw.text((50, 295), leverage_calc, font=font_code, fill=code_color, anchor="lm")
leverage_calc2 = "              stance_weight * foot_stability + approach_weight * approach_cosine) + state_modifiers"
draw.text((50, 320), leverage_calc2, font=font_code, fill=code_color, anchor="lm")

# Component calculations
draw.text((50, 365), "    # Component calculations", font=font_code, fill=comment_color, anchor="lm")
components = [
    "    pad_normalized = clamp((pad_level - 80) / 80, 0, 1)                    # Normalize pad level",
    "    yaw_alignment = 1 - abs(hip_yaw_angle) / 180                           # Hip alignment factor",
    "    foot_stability = 1 - (stance_width - 0.5)² / 0.25                     # Stance stability",
    "    approach_cosine = cos(approach_angle * π / 180)                        # Approach angle factor",
    "    mass_diff = (blocker.mass - defender.mass) / 50                        # Mass difference",
    "    momentum_diff = (blocker.momentum - defender.momentum) / 500           # Momentum difference",
    "    collision_energy = 0.5 * (blocker.mass + defender.mass) * relative_velocity² * cos(impact_angle * π / 180)"
]

y_pos = 390
for comp in components:
    draw.text((50, y_pos), comp, font=font_code, fill=code_color, anchor="lm")
    y_pos += 25

# Variable categories
categories = [
    ("INPUT VARIABLES", 550, (255, 136, 136)),
    ("CALCULATED FACTORS", 750, (136, 255, 136)),
    ("CONSTANTS", 900, (255, 255, 136))
]

for title, y_pos, color in categories:
    draw.text((width//2, y_pos), title, font=font_small, fill=color, anchor="mm")

# Input variables
input_vars = [
    "blocker.mass, defender.mass: Player masses (kg)",
    "blocker.momentum, defender.momentum: Momentum vectors (kg·m/s)",
    "relative_velocity: Speed difference between players (m/s)",
    "impact_angle: Angle of collision (degrees)",
    "pad_level: Height of blocker's pad level (cm)",
    "hip_yaw_angle: Hip rotation angle (degrees)",
    "stance_width: Distance between feet (m)",
    "approach_angle: Angle of approach (degrees)",
    "blocker.fatigue_acute, defender.fatigue_acute: Current fatigue [0,1]",
    "blocker.fatigue_cumulative, defender.fatigue_cumulative: Season fatigue [0,1]",
    "head_position_safe: Boolean for safe head position",
    "twist_load: Torsional stress on body (N·m·deg/s)",
    "surface_condition: Field surface multiplier",
    "weather_factor: Weather impact multiplier",
    "field_zone: Position on field factor",
    "trust_level: Team trust relationship",
    "experience_factor: Player experience bonus"
]

y_pos = 580
for var in input_vars:
    draw.text((50, y_pos), var, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Calculated factors
calc_factors = [
    "leverage: Combined body position advantage [0,1]",
    "mass_diff: Normalized mass difference [-1,1]",
    "momentum_diff: Normalized momentum difference [-1,1]",
    "collision_energy: Impact energy calculation (Joules)",
    "sideline_benefit: Advantage near field boundaries [0,0.25]",
    "spatial_modifier: Field position and pursuit density factor",
    "fatigue_factor: Combined fatigue impact on performance",
    "injury_risk: Probability of injury from contact [0,0.1]",
    "context_multiplier: Environmental and situational factors"
]

y_pos = 780
for factor in calc_factors:
    draw.text((50, y_pos), factor, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Constants
constants = [
    "intercept = -0.5                    # Base probability offset",
    "leverage_coeff = 2.0                # Leverage importance",
    "mass_coeff = 0.1                    # Mass difference weight",
    "momentum_coeff = 0.05               # Momentum difference weight",
    "sideline_coeff = 0.8                # Sideline advantage weight",
    "spatial_coeff = 0.6                 # Spatial context weight",
    "fatigue_coeff = -0.4                # Fatigue penalty weight",
    "injury_coeff = -0.2                 # Injury risk penalty weight",
    "pad_weight = 0.30                   # Pad level importance",
    "yaw_weight = 0.25                   # Hip alignment importance",
    "stance_weight = 0.25                # Foot stability importance",
    "approach_weight = 0.20              # Approach angle importance"
]

y_pos = 920
for const in constants:
    draw.text((50, y_pos), const, font=font_tiny, fill=text_color, anchor="lm")
    y_pos += 20

# Add border
draw.rectangle([(10, 10), (width-10, height-10)], outline=title_color, width=3)

# Add watermark
draw.text((20, height-30), "USE ENGINE v1.0 - Pseudocode Implementation", font=font_tiny, fill=title_color)

# Save the image
image.save('engagement_formula_pseudocode.png')
print("Pseudocode formula image created: engagement_formula_pseudocode.png")
