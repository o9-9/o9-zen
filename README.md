<h1 align="center">o9 Zen</h1>

<div align="center">
  <img src="https://github.com/user-attachments/assets/3c2dbe57-4182-4876-8a53-b7b4f3b0f5b0" width="800" alt="o9 Zen Banner Image" />

[![GitHub Release](https://img.shields.io/badge/release-v9.9-blue.svg)](https://github.com/o9-9/o9-zen/releases/tag/v9.9)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## ✨ Overview

o9 Zen is a Firefox theme and customization suite designed to create a transparent, minimalist browsing experience. This project combines custom CSS, extensions, and system configurations to achieve a zen-like browsing environment.

## 🚀 Quick Install

### Download Resources

- [Chrome Theme](https://github.com/o9-9/o9-zen/releases/download/v9.9/chrome.zip)
- [Wallpaper Collection](https://github.com/o9-9/o9-zen/releases/download/v9.9/Wallpapers.zip)

### Enable Transparency

1. Navigate to `about:config` in Firefox
2. Search for `browser.tabs.allow_transparent_browser`
3. Set it to `true`

### Customize Configuration

- Modify `o9-config.css` to suit your preferences
- Additional settings can be changed in `about:config`

## 🛠️ Setup Instructions

### Install Mica For Everyone

1. Download and install [MicaForEveryone](https://github.com/MicaForEveryone/MicaForEveryone)
2. Add a new rule and process rule for Firefox
3. Change the backdrop type to Acrylic and enable blur behind in advanced options

<div align="center">
  <img height="400" src="https://github.com/user-attachments/assets/34f6965c-1bdc-4ea1-8605-efde3b898d23" alt="Mica For Everyone Configuration" />
</div>

### Windows Settings

1. Disable "Show Accent color on title bars and window borders" in Windows 11 settings

<div align="center">
  <img width="700" src="https://github.com/user-attachments/assets/e867a04e-a8ba-4795-bada-e22ca92fc657" alt="Windows 11 Settings" />
</div>

2. Set color contrast to 0

<div align="center">
  <img width="250" src="https://github.com/user-attachments/assets/aff8398c-9457-4842-bb44-32932cb99e23" alt="Color Contrast Settings" />
</div>

## 💎 Required Extensions

### Zen Internet

[Zen Internet](https://addons.mozilla.org/en-US/firefox/addon/zen-internet/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search) makes web pages transparent, enhancing the minimalist experience.

### Bonjourrr

[Bonjourrr](https://addons.mozilla.org/en-US/firefox/addon/bonjourr-startpage/) provides a clean, customizable new tab page.

Configure Bonjourrr with these settings:

<div align="center">
  <table>
    <tr>
      <td><img src="https://github.com/user-attachments/assets/e7e27035-6e2b-4006-abf7-091a103536f9" alt="Bonjourrr Settings 1" /></td>
      <td><img src="https://github.com/user-attachments/assets/d8fb107f-1247-4a3e-8026-619311e2dee5" alt="Bonjourrr Settings 2" /></td>
      <td><img src="https://github.com/user-attachments/assets/724abcd8-a9f0-4d76-a054-3d76e3c7db60" alt="Bonjourrr Settings 3" /></td>
    </tr>
  </table>
</div>

## ⚙️ Custom CSS

Apply this CSS to achieve the proper font rendering and transparency:

```css
@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300&display=swap');

body, h1, h2, h3, h4, h5, h6, p, span, div {
    font-family: 'Comfortaa', sans-serif !important;
    font-weight: 300 !important;
    letter-spacing: 0.015em;
    font-smooth: always;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: color 0.3s ease, text-shadow 0.3s ease;
}

/* Light mode */
@media (prefers-color-scheme: light) {
    body, h1, h2, h3, h4, h5, h6, p, span, div {
        color: #222222;
        text-shadow: 0 0 1px rgba(0, 0, 0, 0.15);
    }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    body, h1, h2, h3, h4, h5, h6, p, span, div {
        color: #e0e0e0;
        text-shadow: 0 0 1px rgba(255, 255, 255, 0.2);
    }
}

h1 {
    font-weight: 400 !important;
    letter-spacing: 0.025em;
}

p {
    font-weight: 300 !important;
    line-height: 1.6;
    letter-spacing: 0.015em;
}
#background {
    background-color: transparent !important;
}
#background {background-image: none !important; background-color: transparent !important;}
   .tabbing {background-color: transparent !important;} 
    body {background-color: transparent !important;}
#background-wrapper {
    opacity: 0 !important;
}
```

## 📌 Pin Extensions

To complete your setup, pin the required extensions:

<div align="center">
  <img height="400" src="https://github.com/user-attachments/assets/8121a9a4-e8ed-4c4e-8ed0-92bd775438bb" alt="Pinned Extensions" />
</div>

## 

<!-- You can add additional screenshots here to show off your theme -->

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <sub>Made ❤️ by <a href="https://github.com/o9-9">o9</a></sub>
</div>
