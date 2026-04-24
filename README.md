# RealBnB

A browser extension that analyzes Airbnb listings to determine if they are likely primary residences or dedicated rental properties.

## Why This Extension Exists

Airbnb began as a platform where people would rent out their own lived-in homes while they were away, creating authentic travel experiences. Guests could enjoy the comfort and uniqueness of staying in a real home, complete with personal touches and local character.
However, over time, the platform has evolved. Many listings today are no longer primary residences but rather full-time rental properties specifically designed for tourists – sanitized, generic, and missing that "home away from home" feeling that made Airbnb special.
If you've found yourself spending hours scrolling through listings trying to find those authentic gems – homes with personality and character rather than hotel-like rentals – this extension is for you. With a single click, you'll get an instant analysis of how likely a listing is to be someone's actual home that they occasionally share, based on a variety of subtle cues in the listing's text and images.
Rediscover the original Airbnb experience and save time finding spaces that offer a genuine glimpse into local life.

## Features

- Works seamlessly on any Airbnb listing page (URLs matching www.airbnb.*/rooms/*)
- Analyzes both listing text and images using OpenAI's GPT-4o model
- Provides an instant "Lived-In Probability" score (0-100%)
- Highlights key factors that influenced the analysis
- Respects privacy with local-only processing

## Installation

### Firefox

1. Download the code or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Select any file from the extension directory (e.g., manifest.json)

### Chrome
1. Download the code or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable Developer mode using the toggle on the top right
4. Click "Load unpacked"
5. Select the realbnb-chrome folder

## Setup

**This extension requires an OpenAI API key to function.**

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. After installing the extension, click on its icon in your browser toolbar
3. If no API key is set, you'll see a prompt to set up your key
4. Alternatively, on Firefox:
	- right-click on the extension icon and select "Manage Extension"
	- In the about:addons tab, click on the 3 dots on the right of the extension name then select Preferences
	- Enter your OpenAI API key and click "Save"

## Usage

1. Navigate to any Airbnb listing page (e.g., https://www.airbnb.com/rooms/12345)
2. Click the extension icon in your browser toolbar
3. The extension will analyze the listing and display:
   - A "Lived-In Probability" score (0-100%)
   - Positive factors suggesting primary residence (in green)
   - Negative factors suggesting dedicated rental (in red)

## Note About API Keys and Pricing

This extension uses the OpenAI API to analyze listing content. You will need your own OpenAI API key to use this extension. Your API key is stored locally on your device and is never sent to our servers.

When using the OpenAI API, standard OpenAI usage rates apply. Each analysis will count as one API call to the GPT-4o model, which may incur charges depending on your OpenAI plan. For more information on pricing, visit [OpenAI's pricing page](https://openai.com/api/pricing/).

## Privacy and Security

This extension:

- Only accesses data on Airbnb listing pages
- Only communicates with the OpenAI API to analyze listing content
- Stores your API key securely in your browser's local storage
- Does not collect, store, or transmit any personal data
- Does not track your browsing history or activities
- Operates completely client-side, with no server component

## Contributing

Contributions are welcome! If you'd like to improve the extension or report issues, please feel free to:

- Open an issue
- Submit a pull request
- Fork the repository

## License

[MIT License](LICENSE)
