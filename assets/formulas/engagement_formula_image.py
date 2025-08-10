import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import numpy as np

# Set up the figure with a dark theme for better visibility
plt.style.use('dark_background')
fig, ax = plt.subplots(1, 1, figsize=(16, 12))
ax.set_xlim(0, 10)
ax.set_ylim(0, 12)
ax.axis('off')

# Title
ax.text(5, 11.5, 'VIRIDIAN FOOTBALL ENGINE', fontsize=24, fontweight='bold', 
        ha='center', color='#00FF88')
ax.text(5, 11, 'Comprehensive Blocker-Defender Engagement Formula', fontsize=18, 
        ha='center', color='#FFFFFF')

# Main formula
main_formula = r'$P(engagement) = \sigma(\alpha_0 + \alpha_1 \cdot L + \alpha_2 \cdot \Delta m + \alpha_3 \cdot \Delta p + \alpha_4 \cdot s_b + \alpha_5 \cdot s_m + \alpha_6 \cdot f_f + \alpha_7 \cdot i_r) \times c_m$'
ax.text(5, 10.2, main_formula, fontsize=16, ha='center', color='#00FFFF')

# Leverage formula
leverage_formula = r'$L = w_1 \cdot p_n + w_2 \cdot y_a + w_3 \cdot f_s + w_4 \cdot a_c + s_m$'
ax.text(5, 9.5, leverage_formula, fontsize=14, ha='center', color='#FFAA00')

# Component formulas
components = [
    r'$p_n = clamp((p_l - 80)/80, 0, 1)$',
    r'$y_a = 1 - |y_h|/180$',
    r'$f_s = 1 - (s_w - 0.5)^2/0.25$',
    r'$a_c = \cos(a_a \cdot \pi/180)$',
    r'$\Delta m = (m_b - m_d)/50$',
    r'$\Delta p = (p_b - p_d)/500$',
    r'$E_c = 0.5 \cdot (m_b + m_d) \cdot v_r^2 \cdot \cos(\theta_i \cdot \pi/180)$'
]

for i, comp in enumerate(components):
    ax.text(5, 8.5 - i*0.4, comp, fontsize=12, ha='center', color='#88FF88')

# Variable categories
categories = [
    ('PHYSICAL VARIABLES', 6.5, '#FF8888'),
    ('PHYSIOLOGICAL VARIABLES', 5.5, '#88FF88'),
    ('ENVIRONMENTAL VARIABLES', 4.5, '#8888FF'),
    ('CONSTANTS', 3.5, '#FFFF88')
]

for title, y_pos, color in categories:
    ax.text(5, y_pos, title, fontsize=14, fontweight='bold', ha='center', color=color)

# Physical variables
physical_vars = [
    r'$m_b, m_d$: Blocker/Defender mass (kg)',
    r'$p_b, p_d$: Blocker/Defender momentum (kg·m/s)',
    r'$v_r$: Relative velocity (m/s)',
    r'$\theta_i$: Impact angle (degrees)',
    r'$p_l$: Pad level (cm)',
    r'$y_h$: Hip yaw angle (degrees)',
    r'$s_w$: Stance width (m)'
]

for i, var in enumerate(physical_vars):
    ax.text(5, 6.2 - i*0.25, var, fontsize=10, ha='center', color='#FFAAAA')

# Physiological variables
physio_vars = [
    r'$f_{a,b}, f_{a,d}$: Acute fatigue [0,1]',
    r'$f_{c,b}, f_{c,d}$: Cumulative fatigue [0,1]',
    r'$h_u$: Unsafe head position (binary)',
    r'$t_l$: Twist load (N·m·deg/s)'
]

for i, var in enumerate(physio_vars):
    ax.text(5, 5.2 - i*0.25, var, fontsize=10, ha='center', color='#AAFFAA')

# Environmental variables
env_vars = [
    r'$s_c$: Surface condition multiplier',
    r'$w_f$: Weather factor',
    r'$f_z$: Field zone factor',
    r'$t_l$: Trust level',
    r'$e_f$: Experience factor'
]

for i, var in enumerate(env_vars):
    ax.text(5, 4.2 - i*0.25, var, fontsize=10, ha='center', color='#AAAAFF')

# Constants
constants = [
    r'$\alpha_0 = -0.5, \alpha_1 = 2.0, \alpha_2 = 0.1, \alpha_3 = 0.05$',
    r'$\alpha_4 = 0.8, \alpha_5 = 0.6, \alpha_6 = -0.4, \alpha_7 = -0.2$',
    r'$w_1 = 0.30, w_2 = 0.25, w_3 = 0.25, w_4 = 0.20$'
]

for i, const in enumerate(constants):
    ax.text(5, 3.2 - i*0.25, const, fontsize=10, ha='center', color='#FFFFAA')

# Add a border
border = FancyBboxPatch((0.2, 0.2), 9.6, 11.6, 
                       boxstyle="round,pad=0.1", 
                       facecolor='none', 
                       edgecolor='#00FF88', 
                       linewidth=2)
ax.add_patch(border)

# Add engine logo/watermark
ax.text(1, 1, 'USE ENGINE', fontsize=10, color='#00FF88', alpha=0.5)
ax.text(8, 1, 'v1.0', fontsize=10, color='#00FF88', alpha=0.5)

plt.tight_layout()
plt.savefig('engagement_formula.png', dpi=300, bbox_inches='tight', 
            facecolor='black', edgecolor='none')
plt.show()
