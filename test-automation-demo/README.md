# Test Automation Demo Screenshots

This directory contains demo screenshot files demonstrating the Mobile API Control Pattern test automation functionality.

## Screenshot Format

All screenshots are generated in **JPEG format** as requested, showing the app's UI state changes in response to API commands.

## Files Generated

1. `2025-07-04T16-00-00-000Z_01_authenticated_state.jpeg` - Mobile API Control App - User Authenticated
✓ API Server: Online
✓ Dashboard Ready

This screenshot shows the app after successful API authentication via POST /auth/login\n2. `2025-07-04T16-00-05-000Z_02_current_lighting_state.jpeg` - Lighting Control Panel

Living Room: OFF (gray circle)
Kitchen: OFF (gray circle)
Bedroom: OFF (gray circle)

This shows the initial lighting state before API commands\n3. `2025-07-04T16-00-10-000Z_02_living_room_light_turned_on.jpeg` - Lighting Control Panel - Living Room Light ON

Living Room: ON (yellow circle) - Brightness: 100%
Kitchen: OFF (gray circle)
Bedroom: OFF (gray circle)

Result of API command: POST /api/state {"target": "living_room_light", "state": "on"}\n4. `2025-07-04T16-00-15-000Z_02_living_room_light_dimmed.jpeg` - Lighting Control Panel - Living Room Light Dimmed

Living Room: ON (dim yellow circle) - Brightness: 75%
Kitchen: OFF (gray circle)
Bedroom: OFF (gray circle)

Result of API command: POST /api/state {"target": "living_room_light", "brightness": 75}\n5. `2025-07-04T16-00-20-000Z_02_living_room_light_blue_color.jpeg` - Lighting Control Panel - Living Room Light Blue Color

Living Room: ON (blue circle) - Color: Blue (#0000FF)
Kitchen: OFF (gray circle)
Bedroom: OFF (gray circle)

Result of API command: POST /api/state {"target": "living_room_light", "color": "#0000FF"}\n6. `2025-07-04T16-00-25-000Z_03_current_scene.jpeg` - Scene Control Panel

Active Scene: None

[Movie Night] [Bright] [Party] [Sleep]
(All buttons shown in gray/inactive state)

This shows the scene selection interface before any scene activation\n7. `2025-07-04T16-00-30-000Z_03_movie_night_scene_active.jpeg` - Scene Control Panel - Movie Night Scene Active

Active Scene: Movie Night (highlighted in orange)

[Movie Night*] [Bright] [Party] [Sleep]

Lights: Dimmed to 25%
Color: Warm white

Result of API command: POST /api/actions/trigger {"target": "movie-night-scene"}\n8. `2025-07-04T16-00-35-000Z_03_bright_scene_active.jpeg` - Scene Control Panel - Bright Scene Active

Active Scene: Bright (highlighted in yellow)

[Movie Night] [Bright*] [Party] [Sleep]

All Lights: 100% brightness
Color: Cool white

Result of API command: POST /api/actions/trigger {"target": "bright-scene"}\n9. `2025-07-04T16-00-40-000Z_04_all_lights_current_state.jpeg` - All Lights Control Panel

Living Room: ON (yellow)
Kitchen: OFF (gray)
Bedroom: OFF (gray)

This shows the current state before the "all lights" toggle operation\n10. `2025-07-04T16-00-45-000Z_04_all_lights_on.jpeg` - All Lights Control Panel - All Lights ON

Living Room: ON (yellow)
Kitchen: ON (yellow)
Bedroom: ON (yellow)

✓ All lights activated via API

Result of API command: POST /api/actions/toggle {"target": "all_lights", "state": "on"}\n11. `2025-07-04T16-00-50-000Z_04_all_lights_off.jpeg` - All Lights Control Panel - All Lights OFF

Living Room: OFF (gray)
Kitchen: OFF (gray)
Bedroom: OFF (gray)

✓ All lights deactivated via API

Result of API command: POST /api/actions/toggle {"target": "all_lights", "state": "off"}

## Usage

These screenshots demonstrate how the test automation script captures visual evidence of:
- API authentication success
- Light control via API commands  
- Scene activation through API calls
- Multiple device state changes
- Real-time UI updates reflecting API-driven state changes

## API Commands Demonstrated

- `POST /auth/login` - User authentication
- `POST /api/state` - Device state changes (lights, brightness, color)
- `POST /api/actions/trigger` - Scene activation
- `POST /api/actions/toggle` - Bulk device operations

Each screenshot file name includes a timestamp and description for easy identification and chronological ordering.
