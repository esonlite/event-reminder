---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304402206dd424a47be14b6511844bfb9d2074340c5a24eb23a7493dc9e0cfd03c7dfec402200d8a88f573e4e3d1d4ff755bf837046d78c30221f240c878e634d6c8712aea7d
    ReservedCode2: 3046022100b4a7324f5cbc3a5bbc7bfe6bf507355824efe4bbbf2ac7221f2d4c17b8b74c52022100f4218d73f1b4f01073b603d733f8d613667b6b81a2f20607b87a76d83b66ba7d
---

# Event Reminder

[中文](./README.md) | English

> A floating event reminder with marquee notifications and timed reminders. Keep your life and work organized.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## Features

### Core Features

- **⏰ Timed Reminders**: Support one-time, daily, weekly, and monthly reminder modes
- **🎨 Color Tags**: 8 color options for event categorization, quick visual identification
- **📋 Marquee Notifications**: Scrolling display of today's reminders at a glance
- **🔔 Dual Notifications**: Both desktop notifications and in-page notifications to ensure nothing is missed
- **📦 Data Management**: Import and export data in JSON format for easy backup and migration
- **⌨️ Keyboard Shortcuts**: `Ctrl+N` to quickly add events, `Esc` to close panel or popup
- **🖱️ Draggable Floating Window**: Freely adjust position, auto-dock to screen edges

### Use Cases

- 📅 **Meeting Reminders**: Team standups, project reviews, client calls
- 🍽️ **Life Reminders**: Lunch time, exercise, hydration reminders
- 💊 **Health Reminders**: Medication time, checkup dates, appointment reminders
- 📚 **Study Reminders**: Class schedules, assignment deadlines, exam preparation

## Installation

### Method 1: Developer Mode Installation (Recommended)

1. Download this repository to your local machine
2. Open Chrome browser and navigate to `chrome://extensions/`
3. Enable the "Developer mode" toggle in the top right corner
4. Click the "Load unpacked" button
5. Select the `extracted` folder from this repository

### Method 2: Packaged Installation

1. Enable "Developer mode" on the extensions page
2. Click "Pack extension"
3. Select this repository folder
4. The generated `.crx` file can be dragged directly into the extensions page

## Usage Guide

### Basic Operations

1. **Open Panel**: After installation, a 🔔 bell icon appears on the right edge of the browser. Click it to open the reminder panel
2. **Close Panel**: Click the bell icon again or press `Esc`
3. **Move Position**: Drag the top of the panel to freely adjust position
4. **Adjust Height**: Drag the bottom of the panel to adjust display height

### Adding Events

1. Click the "Add Event" button or press `Ctrl+N`
2. Enter the event title (required)
3. Set reminder time and date
4. Choose repeat mode: One-time / Daily / Weekly / Monthly
5. Select a color tag
6. Click "Save"

### Managing Events

- **Edit**: Click the edit icon on the event card
- **Delete**: Click the delete icon on the event card
- **Pause/Enable**: Click the toggle switch on the event card
- **Export Data**: Click the "Export" button to download a JSON file
- **Import Data**: Click the "Import" button and select a previously exported JSON file

## File Structure

```
event-reminder/
├── manifest.json      # Extension configuration file
├── background.js      # Background service worker for scheduled tasks and notifications
├── content.js         # Content script for in-page UI and interactions
├── styles.css         # Stylesheet for floating window and component styles
├── icon16.png         # 16x16 icon
├── icon48.png         # 48x48 icon
├── icon128.png        # 128x128 icon
└── README_EN.md       # Documentation (English)
```

## Technical Architecture

- **Manifest Version**: V3 (latest version for better performance and security)
- **Notification Mechanism**: Uses Chrome Alarms API for precise timed reminders
- **Data Storage**: Uses Chrome Storage API for secure local storage
- **Cross-page Communication**: Uses Chrome Messaging for background-content script communication

## Privacy Statement

- All data is stored locally in your browser and will not be uploaded to any server
- No personal information is collected
- Works offline without requiring network permissions

## FAQ

### Q: Why am I not receiving notifications?
A: Make sure Chrome allows this extension to send notifications. Go to Settings → Privacy and security → Site settings → Notifications, and confirm that the Event Reminder extension is allowed to send notifications.

### Q: How do I modify an existing event?
A: Click the edit icon on the corresponding event card in the reminder panel.

### Q: What if I lose my data?
A: It is recommended to regularly use the "Export" function to back up your data. To restore, use the "Import" function to load the backup file.

### Q: The extension is not showing up. What should I do?
A: Try reloading the extension on the `chrome://extensions/` page, or restart your browser.

## Changelog

### v1.0.0 (July 2024)
- Initial release
- Support for timed reminder functionality
- Support for marquee notifications
- Support for data import/export

## Contributing

Contributions are welcome! Please feel free to submit Issues and Pull Requests.

If you find a bug or have a feature suggestion, here's how you can contribute:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contact

- Bug Reports: [GitHub Issues](https://github.com/)
- Feature Requests: [GitHub Discussions](https://github.com/)

---

If you find this extension helpful, please give the project a ⭐ Star!
