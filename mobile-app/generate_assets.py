"""
ExamSphere Mobile Asset Generator
Generates a complete, unified, enterprise-grade asset suite for ExamSphere Mobile (React Native / Expo).
Includes:
- App Icons (iOS & Android)
- Adaptive Icons (Foreground, Background, Monochrome)
- Splash Screen Icon
- Web Favicon
- Horizontal Brand Logos (Light & Dark)
- Standalone Brand Mark
- Feature & Navigation Icons
- Empty State & Status Illustrations
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
BRANDING_DIR = os.path.join(ASSETS_DIR, 'branding')
ICONS_DIR = os.path.join(ASSETS_DIR, 'icons')
ILLUSTRATIONS_DIR = os.path.join(ASSETS_DIR, 'illustrations')

# Ensure target directories exist
for d in [ASSETS_DIR, BRANDING_DIR, ICONS_DIR, ILLUSTRATIONS_DIR]:
    os.makedirs(d, exist_ok=True)

# Brand Color Palette
COLOR_NAVY_DEEP = (11, 15, 25, 255)       # #0B0F19
COLOR_SLATE_900 = (15, 23, 42, 255)       # #0F172A
COLOR_SLATE_800 = (30, 41, 59, 255)       # #1E293B
COLOR_SLATE_500 = (100, 116, 139, 255)    # #64748B
COLOR_SLATE_400 = (148, 163, 184, 255)    # #94A3B8
COLOR_SLATE_100 = (241, 245, 249, 255)    # #F1F5F9

COLOR_INDIGO_600 = (79, 70, 229, 255)     # #4F46E5
COLOR_INDIGO_500 = (99, 102, 241, 255)    # #6366F1
COLOR_INDIGO_400 = (129, 140, 248, 255)   # #818CF8
COLOR_INDIGO_100 = (224, 231, 255, 255)   # #E0E7FF

COLOR_CYAN_400 = (34, 211, 238, 255)      # #22D3EE
COLOR_CYAN_500 = (6, 182, 212, 255)       # #06B6D4
COLOR_TEAL_500 = (20, 184, 166, 255)      # #14B8A6
COLOR_EMERALD = (16, 185, 129, 255)       # #10B981
COLOR_AMBER = (245, 158, 11, 255)         # #F59E0B
COLOR_WHITE = (255, 255, 255, 255)

def get_font(name, size):
    try:
        return ImageFont.truetype(name, size)
    except Exception:
        try:
            return ImageFont.truetype('arial.ttf', size)
        except Exception:
            return ImageFont.load_default()

def draw_examsphere_emblem(draw, center_x, center_y, radius, monochrome=False):
    """
    Renders the official ExamSphere emblem:
    Concentric dimensional sphere with academic rings + diamond nucleus + orbital halo.
    """
    cx, cy = center_x, center_y
    r = radius

    # 1. Outer subtle orbital ring
    orbital_rx = int(r * 1.05)
    orbital_ry = int(r * 0.42)
    ring_color = (255, 255, 255, 180) if monochrome else (99, 102, 241, 140)
    draw.ellipse(
        [cx - orbital_rx, cy - orbital_ry, cx + orbital_rx, cy + orbital_ry],
        outline=ring_color,
        width=int(max(2, r * 0.045))
    )

    # 2. Main Sphere Outer Shell
    main_fill = (255, 255, 255, 255) if monochrome else (30, 27, 75, 255) # deep indigo-950
    main_stroke = (255, 255, 255, 255) if monochrome else (129, 140, 248, 255)
    draw.ellipse(
        [cx - r, cy - r, cx + r, cy + r],
        fill=main_fill,
        outline=main_stroke,
        width=int(max(3, r * 0.06))
    )

    if not monochrome:
        # Inner sphere radial gradient glow
        inner_r = int(r * 0.88)
        draw.ellipse(
            [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
            fill=(49, 46, 129, 255) # indigo-900
        )
        glow_r = int(r * 0.65)
        draw.ellipse(
            [cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r],
            fill=(67, 56, 202, 255) # indigo-700
        )

    # 3. Longitudinal & Latitudinal Dimensional Curves
    lat_w = int(r * 0.85)
    lat_h1 = int(r * 0.35)
    lat_h2 = int(r * 0.65)
    curve_color = (255, 255, 255, 120) if monochrome else (165, 180, 252, 100)
    line_w = int(max(1, r * 0.025))

    draw.arc([cx - lat_w, cy - lat_h1, cx + lat_w, cy + lat_h1], 0, 360, fill=curve_color, width=line_w)
    draw.arc([cx - lat_w, cy - lat_h2, cx + lat_w, cy + lat_h2], 0, 360, fill=curve_color, width=line_w)
    draw.arc([cx - int(r * 0.38), cy - r, cx + int(r * 0.38), cy + r], 0, 360, fill=curve_color, width=line_w)

    # 4. Central Diamond / Academic Stylus Nucleus
    d_size = int(r * 0.45)
    pts = [
        (cx, cy - d_size),         # Top
        (cx + int(d_size * 0.75), cy), # Right
        (cx, cy + d_size),         # Bottom
        (cx - int(d_size * 0.75), cy)  # Left
    ]
    diamond_fill = (255, 255, 255, 255) if monochrome else (34, 211, 238, 255) # Electric cyan
    diamond_stroke = (255, 255, 255, 255) if monochrome else (255, 255, 255, 255)
    draw.polygon(pts, fill=diamond_fill, outline=diamond_stroke)

    # Inner core contrast diamond
    inner_d = int(d_size * 0.55)
    inner_pts = [
        (cx, cy - inner_d),
        (cx + int(inner_d * 0.75), cy),
        (cx, cy + inner_d),
        (cx - int(inner_d * 0.75), cy)
    ]
    inner_fill = (15, 23, 42, 255) if monochrome else (79, 70, 229, 255) # Indigo
    draw.polygon(inner_pts, fill=inner_fill)

    # 5. Core 4-Pointed Star of Academic Excellence
    star_r = int(r * 0.18)
    star_inner = int(star_r * 0.3)
    star_pts = []
    for i in range(8):
        dist = star_r if i % 2 == 0 else star_inner
        ang = i * (math.pi / 4)
        star_pts.append((cx + int(dist * math.cos(ang)), cy + int(dist * math.sin(ang))))
    draw.polygon(star_pts, fill=COLOR_WHITE)

    # 6. Foreground orbital arc (overlays sphere to establish 3D depth)
    fore_ring_color = (255, 255, 255, 255) if monochrome else (34, 211, 238, 220)
    draw.arc(
        [cx - orbital_rx, cy - orbital_ry, cx + orbital_rx, cy + orbital_ry],
        0, 180,
        fill=fore_ring_color,
        width=int(max(3, r * 0.055))
    )

def create_app_icon():
    """Generates 1024x1024 Master App Icon with deep midnight background and centered ExamSphere emblem"""
    size = 1024
    img = Image.new('RGBA', (size, size), (15, 23, 42, 255)) # #0F172A
    draw = ImageDraw.Draw(img)

    # Clean atmospheric radial illumination
    center = size // 2
    for r in range(480, 180, -15):
        factor = (480 - r) / 300.0
        # Blend from #0F172A (15, 23, 42) towards indigo #1E1B4B (30, 27, 75)
        r_c = int(15 + (30 - 15) * factor)
        g_c = int(23 + (27 - 23) * factor)
        b_c = int(42 + (75 - 42) * factor)
        draw.ellipse([center - r, center - r, center + r, center + r], fill=(r_c, g_c, b_c, 255))

    # Draw emblem in center (radius = 320px)
    draw_examsphere_emblem(draw, size // 2, size // 2, 320)

    # Output icon.png
    out_path = os.path.join(ASSETS_DIR, 'icon.png')
    img.save(out_path, 'PNG', optimize=True)
    print(f"[OK] Created {out_path} ({size}x{size})")

def create_adaptive_foreground():
    """Generates 512x512 Android Adaptive Foreground with transparent background & 66% safe-zone"""
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 66% safe zone diameter is ~338px -> radius is ~140px
    draw_examsphere_emblem(draw, size // 2, size // 2, 140)

    out_path = os.path.join(ASSETS_DIR, 'android-icon-foreground.png')
    img.save(out_path, 'PNG', optimize=True)
    print(f"[OK] Created {out_path} ({size}x{size})")

def create_adaptive_background():
    """Generates 512x512 Android Adaptive Background"""
    size = 512
    img = Image.new('RGBA', (size, size), (15, 23, 42, 255)) # #0F172A
    draw = ImageDraw.Draw(img)

    center = size // 2
    for r in range(240, 90, -10):
        factor = (240 - r) / 150.0
        r_c = int(15 + (30 - 15) * factor)
        g_c = int(23 + (27 - 23) * factor)
        b_c = int(42 + (75 - 42) * factor)
        draw.ellipse([center - r, center - r, center + r, center + r], fill=(r_c, g_c, b_c, 255))

    out_path = os.path.join(ASSETS_DIR, 'android-icon-background.png')
    img.save(out_path, 'PNG', optimize=True)
    print(f"[OK] Created {out_path} ({size}x{size})")

def create_adaptive_monochrome():
    """Generates 432x432 Monochrome Adaptive Icon for Android 13+ Material Themed Icons"""
    size = 432
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw_examsphere_emblem(draw, size // 2, size // 2, 120, monochrome=True)

    out_path = os.path.join(ASSETS_DIR, 'android-icon-monochrome.png')
    img.save(out_path, 'PNG', optimize=True)
    print(f"[OK] Created {out_path} ({size}x{size})")

def create_splash_icon():
    """Generates 1024x1024 Minimalist Brand Splash Screen Icon"""
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Center Emblem (radius 210)
    cy = int(size * 0.44)
    draw_examsphere_emblem(draw, size // 2, cy, 210)

    # Brand Wordmark "ExamSphere" (Dual Tone)
    font_bold = get_font('segoeuib.ttf', 72)
    font_sub = get_font('segoeui.ttf', 24)

    bbox_exam = draw.textbbox((0, 0), "Exam", font=font_bold)
    exam_w = bbox_exam[2] - bbox_exam[0]
    bbox_sphere = draw.textbbox((0, 0), "Sphere", font=font_bold)
    sphere_w = bbox_sphere[2] - bbox_sphere[0]
    total_title_w = exam_w + sphere_w
    start_x = size // 2 - total_title_w // 2
    title_y = int(size * 0.73)

    draw.text((start_x, title_y), "Exam", font=font_bold, fill=(15, 23, 42, 255))
    draw.text((start_x + exam_w, title_y), "Sphere", font=font_bold, fill=(79, 70, 229, 255))

    # Subtitle Tagline
    text_sub = "ASSESSMENT & PROCTORING PLATFORM"
    bbox_sub = draw.textbbox((0, 0), text_sub, font=font_sub)
    sub_w = bbox_sub[2] - bbox_sub[0]
    draw.text((size // 2 - sub_w // 2, int(size * 0.82)), text_sub, font=font_sub, fill=(100, 116, 139, 255))

    out_path = os.path.join(ASSETS_DIR, 'splash-icon.png')
    img.save(out_path, 'PNG', optimize=True)
    print(f"[OK] Created {out_path} ({size}x{size})")

def create_favicon():
    """Generates 48x48 Web Favicon"""
    size = 48
    # Render at 4x (192px) and downsample
    render_size = 192
    img = Image.new('RGBA', (render_size, render_size), (11, 15, 25, 255))
    draw = ImageDraw.Draw(img)

    draw_examsphere_emblem(draw, render_size // 2, render_size // 2, 72)
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)

    out_path = os.path.join(ASSETS_DIR, 'favicon.png')
    final_img.save(out_path, 'PNG', optimize=True)
    print(f"[OK] Created {out_path} ({size}x{size})")

def create_branding_logos():
    """Generates Horizontal Brand Logos (Light & Dark backgrounds) and Standalone Mark"""
    # 1. Standalone Mark (512x512)
    mark_img = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    mark_draw = ImageDraw.Draw(mark_img)
    draw_examsphere_emblem(mark_draw, 256, 256, 190)
    mark_path = os.path.join(BRANDING_DIR, 'examsphere-mark.png')
    mark_img.save(mark_path, 'PNG', optimize=True)
    print(f"[OK] Created {mark_path} (512x512)")

    # 2. Horizontal Primary Logo (800x200) for Light Backgrounds
    logo_w, logo_h = 800, 200
    logo_img = Image.new('RGBA', (logo_w, logo_h), (0, 0, 0, 0))
    logo_draw = ImageDraw.Draw(logo_img)

    # Draw Emblem on left
    draw_examsphere_emblem(logo_draw, 100, 100, 68)

    # Typography
    font_title = get_font('segoeuib.ttf', 56)
    font_sub = get_font('segoeui.ttf', 16)

    bbox_exam = logo_draw.textbbox((0, 0), "Exam", font=font_title)
    exam_w = bbox_exam[2] - bbox_exam[0]
    sphere_x = 195 + exam_w + 2

    logo_draw.text((195, 52), "Exam", font=font_title, fill=(15, 23, 42, 255))
    logo_draw.text((sphere_x, 52), "Sphere", font=font_title, fill=(79, 70, 229, 255))
    logo_draw.text((198, 126), "ENTERPRISE ASSESSMENT & PROCTORING", font=font_sub, fill=(100, 116, 139, 255))

    logo_path = os.path.join(BRANDING_DIR, 'examsphere-logo.png')
    logo_img.save(logo_path, 'PNG', optimize=True)
    print(f"[OK] Created {logo_path} ({logo_w}x{logo_h})")

    # 3. Horizontal White Logo (800x200) for Dark Backgrounds
    white_img = Image.new('RGBA', (logo_w, logo_h), (0, 0, 0, 0))
    white_draw = ImageDraw.Draw(white_img)

    draw_examsphere_emblem(white_draw, 100, 100, 68)
    white_draw.text((195, 52), "Exam", font=font_title, fill=(255, 255, 255, 255))
    white_draw.text((sphere_x, 52), "Sphere", font=font_title, fill=(34, 211, 238, 255)) # Cyan
    white_draw.text((198, 126), "ENTERPRISE ASSESSMENT & PROCTORING", font=font_sub, fill=(148, 163, 184, 255))

    white_path = os.path.join(BRANDING_DIR, 'examsphere-logo-white.png')
    white_img.save(white_path, 'PNG', optimize=True)
    print(f"[OK] Created {white_path} ({logo_w}x{logo_h})")

def create_feature_and_nav_icons():
    """Generates 96x96 Navigation and Module Icons"""
    icons = [
        ('nav-exams.png', 'exam'),
        ('nav-rankings.png', 'rankings'),
        ('nav-alerts.png', 'alerts'),
        ('nav-profile.png', 'profile'),
        ('icon-coding.png', 'coding'),
        ('icon-proctoring.png', 'proctoring'),
        ('icon-timer.png', 'timer'),
        ('icon-certificate.png', 'certificate'),
    ]

    size = 96
    for fname, itype in icons:
        # 2x supersampling for ultra-crisp strokes
        r_size = 192
        img = Image.new('RGBA', (r_size, r_size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        cx, cy = r_size // 2, r_size // 2

        if itype == 'exam':
            # Assessment Clipboard + Checkmark
            bx, by, bw, bh = 44, 38, 104, 124
            draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=16, fill=(238, 242, 255, 255), outline=COLOR_INDIGO_600, width=8)
            # Clip top
            draw.rounded_rectangle([cx - 24, 26, cx + 24, 48], radius=6, fill=COLOR_INDIGO_600)
            # Checkmark inside
            draw.line([(cx - 24, cy + 8), (cx - 6, cy + 26), (cx + 28, cy - 14)], fill=COLOR_EMERALD, width=10)

        elif itype == 'rankings':
            # Trophy Cup
            draw.polygon([(cx - 36, cy - 32), (cx + 36, cy - 32), (cx + 28, cy + 18), (cx - 28, cy + 18)], fill=COLOR_AMBER, outline=(217, 119, 6, 255), width=6)
            # Stem and base
            draw.rectangle([cx - 8, cy + 18, cx + 8, cy + 42], fill=COLOR_AMBER)
            draw.rounded_rectangle([cx - 32, cy + 42, cx + 32, cy + 56], radius=6, fill=(217, 119, 6, 255))
            # Handles
            draw.arc([cx - 54, cy - 28, cx - 20, cy + 8], 90, 270, fill=COLOR_AMBER, width=8)
            draw.arc([cx + 20, cy - 28, cx + 54, cy + 8], 270, 90, fill=COLOR_AMBER, width=8)
            # Star on cup
            draw.text((cx - 10, cy - 20), "★", font=get_font('arial.ttf', 24), fill=COLOR_WHITE)

        elif itype == 'alerts':
            # Notification Bell
            bx, by = cx, cy - 10
            draw.arc([bx - 36, by - 36, bx + 36, by + 36], 180, 360, fill=COLOR_INDIGO_600, width=10)
            draw.polygon([(bx - 36, by), (bx + 36, by), (bx + 44, by + 34), (bx - 44, by + 34)], fill=COLOR_INDIGO_600)
            draw.ellipse([bx - 12, by + 36, bx + 12, by + 52], fill=COLOR_AMBER)
            # Pulse indicator
            draw.ellipse([bx + 24, by - 34, bx + 42, by - 16], fill=(239, 68, 68, 255))

        elif itype == 'profile':
            # Academic Candidate Profile
            head_r = 28
            draw.ellipse([cx - head_r, cy - 42 - head_r, cx + head_r, cy - 42 + head_r], fill=COLOR_INDIGO_600)
            # Shoulders
            draw.arc([cx - 52, cy + 4, cx + 52, cy + 96], 180, 360, fill=COLOR_INDIGO_600, width=16)

        elif itype == 'coding':
            # Terminal Code Brackets
            draw.rounded_rectangle([32, 38, 160, 154], radius=16, fill=(15, 23, 42, 255), outline=COLOR_TEAL_500, width=8)
            # Left and right brackets
            draw.line([(cx - 24, cy - 18), (cx - 40, cy), (cx - 24, cy + 18)], fill=COLOR_CYAN_400, width=8)
            draw.line([(cx + 24, cy - 18), (cx + 40, cy), (cx + 24, cy + 18)], fill=COLOR_CYAN_400, width=8)
            draw.line([(cx + 8, cy - 22), (cx - 8, cy + 22)], fill=COLOR_TEAL_500, width=8)

        elif itype == 'proctoring':
            # Shield with Biometric Lens
            pts = [(cx, 32), (cx + 46, 52), (cx + 40, 110), (cx, 156), (cx - 40, 110), (cx - 46, 52)]
            draw.polygon(pts, fill=(240, 253, 250, 255), outline=COLOR_TEAL_500, width=8)
            # Lens
            draw.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=COLOR_TEAL_500)
            draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=COLOR_WHITE)

        elif itype == 'timer':
            # Clock
            draw.ellipse([cx - 52, cy - 52, cx + 52, cy + 52], fill=(255, 251, 235, 255), outline=COLOR_AMBER, width=8)
            # Hands
            draw.line([(cx, cy), (cx, cy - 32)], fill=(180, 83, 9, 255), width=8)
            draw.line([(cx, cy), (cx + 22, cy)], fill=(180, 83, 9, 255), width=8)
            draw.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(180, 83, 9, 255))

        elif itype == 'certificate':
            # Certificate Scroll with Ribbon
            draw.rounded_rectangle([38, 44, 154, 148], radius=12, fill=(238, 242, 255, 255), outline=COLOR_INDIGO_600, width=8)
            # Lines
            draw.line([(56, 76), (136, 76)], fill=COLOR_INDIGO_400, width=6)
            draw.line([(56, 98), (116, 98)], fill=COLOR_INDIGO_400, width=6)
            # Seal
            draw.ellipse([cx + 20, cy + 12, cx + 54, cy + 46], fill=COLOR_AMBER)

        final_icon = img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(ICONS_DIR, fname)
        final_icon.save(out_path, 'PNG', optimize=True)
        print(f"[OK] Created {out_path} ({size}x{size})")

def create_illustrations():
    """Generates 400x400 Modern Empty State and Celebration Illustrations"""
    illustrations = [
        ('empty-exams.png', 'empty_exams'),
        ('empty-notifications.png', 'empty_notifs'),
        ('empty-results.png', 'empty_results'),
        ('exam-success.png', 'exam_success'),
        ('error-state.png', 'error_state'),
    ]

    size = 400
    for fname, itype in illustrations:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        cx, cy = size // 2, size // 2

        # 1. Soft Circular Aura Background
        bg_r = 140
        aura_color = (238, 242, 255, 255) if itype != 'exam_success' and itype != 'error_state' else ((236, 253, 245, 255) if itype == 'exam_success' else (254, 242, 242, 255))
        draw.ellipse([cx - bg_r, cy - bg_r, cx + bg_r, cy + bg_r], fill=aura_color)

        if itype == 'empty_exams':
            # Assessment Clipboard with Calendar Motif
            cb_x, cb_y, cb_w, cb_h = cx - 70, cy - 85, 140, 170
            draw.rounded_rectangle([cb_x, cb_y, cb_x + cb_w, cb_y + cb_h], radius=20, fill=COLOR_WHITE, outline=COLOR_INDIGO_600, width=6)
            # Clip
            draw.rounded_rectangle([cx - 32, cb_y - 14, cx + 32, cb_y + 16], radius=8, fill=COLOR_INDIGO_600)
            # Lines
            draw.rounded_rectangle([cb_x + 24, cb_y + 45, cb_x + cb_w - 24, cb_y + 55], radius=5, fill=COLOR_INDIGO_100)
            draw.rounded_rectangle([cb_x + 24, cb_y + 70, cb_x + cb_w - 45, cb_y + 80], radius=5, fill=COLOR_INDIGO_100)
            draw.rounded_rectangle([cb_x + 24, cb_y + 95, cb_x + cb_w - 60, cb_y + 105], radius=5, fill=COLOR_INDIGO_100)
            # Sparkling verified check
            draw.ellipse([cx + 35, cy + 45, cx + 85, cy + 95], fill=COLOR_EMERALD)
            draw.line([(cx + 48, cy + 70), (cx + 57, cy + 80), (cx + 74, cy + 62)], fill=COLOR_WHITE, width=6)

        elif itype == 'empty_notifs':
            # Bell with Peaceful Radiating Rings
            bell_r = 45
            draw.arc([cx - 85, cy - 85, cx + 85, cy + 85], 200, 340, fill=COLOR_INDIGO_400, width=4)
            draw.arc([cx - 110, cy - 110, cx + 110, cy + 110], 210, 330, fill=COLOR_INDIGO_100, width=4)
            # Bell body
            draw.arc([cx - bell_r, cy - 40 - bell_r, cx + bell_r, cy - 40 + bell_r], 180, 360, fill=COLOR_INDIGO_600, width=12)
            draw.polygon([(cx - bell_r, cy - 40), (cx + bell_r, cy - 40), (cx + bell_r + 14, cy + 15), (cx - bell_r - 14, cy + 15)], fill=COLOR_INDIGO_600)
            draw.rounded_rectangle([cx - bell_r - 18, cy + 15, cx + bell_r + 18, cy + 25], radius=5, fill=COLOR_INDIGO_600)
            draw.ellipse([cx - 14, cy + 22, cx + 14, cy + 46], fill=COLOR_AMBER)
            # Resting spark
            draw.text((cx - 10, cy - 10), "✓", font=get_font('segoeuib.ttf', 28), fill=COLOR_WHITE)

        elif itype == 'empty_results':
            # Chart / Analytics Board with Waiting Hourglass
            bx, by, bw, bh = cx - 80, cy - 70, 160, 140
            draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=16, fill=COLOR_WHITE, outline=COLOR_INDIGO_600, width=6)
            # Bar chart
            draw.rectangle([bx + 26, cy + 20, bx + 48, cy + 48], fill=COLOR_INDIGO_100)
            draw.rectangle([bx + 62, cy - 5, bx + 84, cy + 48], fill=COLOR_INDIGO_400)
            draw.rectangle([bx + 98, cy - 25, bx + 120, cy + 48], fill=COLOR_INDIGO_600)
            # Search lens badge
            draw.ellipse([cx + 30, cy + 30, cx + 80, cy + 80], fill=COLOR_AMBER)
            draw.text((cx + 46, cy + 42), "⏳", font=get_font('arial.ttf', 22), fill=COLOR_WHITE)

        elif itype == 'exam_success':
            # Victory Trophy + Laurels + Gold Star
            draw.polygon([(cx - 50, cy - 60), (cx + 50, cy - 60), (cx + 40, cy + 20), (cx - 40, cy + 20)], fill=COLOR_AMBER, outline=(217, 119, 6, 255), width=8)
            draw.rectangle([cx - 12, cy + 20, cx + 12, cy + 55], fill=COLOR_AMBER)
            draw.rounded_rectangle([cx - 45, cy + 55, cx + 45, cy + 75], radius=8, fill=(217, 119, 6, 255))
            # Handles
            draw.arc([cx - 78, cy - 55, cx - 35, cy + 5], 90, 270, fill=COLOR_AMBER, width=10)
            draw.arc([cx + 35, cy - 55, cx + 78, cy + 5], 270, 90, fill=COLOR_AMBER, width=10)
            # Central Star
            draw.text((cx - 16, cy - 35), "★", font=get_font('arial.ttf', 38), fill=COLOR_WHITE)
            # Confetti / Sparkles
            draw.ellipse([cx - 95, cy - 80, cx - 85, cy - 70], fill=COLOR_CYAN_400)
            draw.ellipse([cx + 85, cy - 75, cx + 97, cy - 63], fill=COLOR_EMERALD)
            draw.ellipse([cx + 105, cy + 20, cx + 115, cy + 30], fill=COLOR_INDIGO_500)
            draw.ellipse([cx - 110, cy + 15, cx - 100, cy + 25], fill=COLOR_AMBER)

        elif itype == 'error_state':
            # Connection Shield with Alert
            pts = [(cx, cy - 80), (cx + 65, cy - 50), (cx + 55, cy + 35), (cx, cy + 95), (cx - 55, cy + 35), (cx - 65, cy - 50)]
            draw.polygon(pts, fill=COLOR_WHITE, outline=(239, 68, 68, 255), width=8)
            # Alert Exclamation
            draw.line([(cx, cy - 38), (cx, cy + 15)], fill=(239, 68, 68, 255), width=10)
            draw.ellipse([cx - 5, cy + 30, cx + 5, cy + 40], fill=(239, 68, 68, 255))

        out_path = os.path.join(ILLUSTRATIONS_DIR, fname)
        img.save(out_path, 'PNG', optimize=True)
        print(f"[OK] Created {out_path} ({size}x{size})")

def main():
    print("====================================================")
    print("EXAMSPHERE MOBILE ASSET GENERATOR & REDESIGN")
    print("====================================================")
    create_app_icon()
    create_adaptive_foreground()
    create_adaptive_background()
    create_adaptive_monochrome()
    create_splash_icon()
    create_favicon()
    create_branding_logos()
    create_feature_and_nav_icons()
    create_illustrations()
    print("====================================================")
    print("ALL ASSETS GENERATED SUCCESSFULLY")
    print("====================================================")

if __name__ == '__main__':
    main()
