# SplitSave

Generate UPI payment QR codes and automatically split large amounts into smaller, equal QR codes that stay under a limit you choose (default: ₹1,999).

SplitSave runs entirely in the browser. There is no backend, no database and no account. Nothing you type leaves your device.

## Features

### QR generation
- Standard UPI deep-link QR codes (`upi://pay?...`) that open pre-filled in any UPI app (Google Pay, PhonePe, Paytm, BHIM and others).
- Enter your UPI ID, an optional payee name and the amount to collect.
- UPI ID validation with instant feedback.
- Your UPI ID and payee name are remembered in the browser for next time.

### Smart splitting
- Amounts above your limit are split automatically into the fewest equal parts, each part at or below the limit.
- Decimals are supported (up to 2 places). Splitting is done in paise, so the parts always add up to the exact total. Example: ₹5,000 with a ₹1,999 limit becomes ₹1,666.67 + ₹1,666.67 + ₹1,666.66.
- Amounts at or below the limit produce a single QR code.
- Live preview of the split (for example `₹5,000 × 3`) before generating.
- Custom limit: choose a preset (₹1,999, ₹1,500, ₹1,000, ₹500) or type your own.
- Split on/off switch. When off, you always get a single QR, with a warning if the amount is above your limit.

### Payment flow
- Generating opens a full-screen payment page showing one QR code at a time.
- Each QR is shown on a portrait (9:16) flip card. The QR is on top, with the payment details below:
  - Paid to (name and UPI ID)
  - Amount for this QR
  - Total amount
  - Number of equal parts
  - Payment number ("1st payment", "2nd payment", ... "Last payment")
- Press **Mark done** after each payment is received. The card flips to reveal the next QR.
- A progress indicator shows which payment you are on.
- A completion screen with a confetti animation appears after the last payment.

### History
- Completed payments are saved automatically in the browser.
- A payment of ₹3,000 paid in two parts is shown as `₹3,000 × 2` with the individual parts listed underneath.
- Reuse a previous amount, delete a single entry or clear everything. The latest 50 entries are kept.

### Sharing
- A share menu is available on the home page, the QR page and the completion screen.
- Options: WhatsApp, Telegram, X, Email, Message (SMS), Copy link and More (the device's native share sheet).

### Appearance
- Neumorphic design with soft shadows and smooth animations.
- Light and dark themes. The first visit follows your system setting, and your choice is remembered.
- Responsive layout for phones, tablets and desktops.
- Respects the "reduce motion" accessibility setting.

## How the split works

```
totalPaise = round(amount × 100)
parts      = ceil(totalPaise / (limit × 100))
base       = floor(totalPaise / parts)
extra      = totalPaise − base × parts      // spread 1 paisa each over the first `extra` parts
```

Every part is within 1 paisa of the others, no part exceeds the limit, and the sum is exactly the total.

## UPI link format

Each QR encodes a link like:

```
upi://pay?pa=name@bank&pn=Name&am=1666.67&cu=INR&tn=Part%201%2F3
```

| Parameter | Meaning |
| --- | --- |
| `pa` | Payee UPI ID |
| `pn` | Payee name |
| `am` | Amount (2 decimals) |
| `cu` | Currency (`INR`) |
| `tn` | Transaction note (for example `Part 1/3`) |

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) and [React](https://react.dev/)
- TypeScript
- [Framer Motion](https://www.framer.com/motion/) for animations
- [qrcode.react](https://github.com/zpao/qrcode.react) for QR codes
- Plain CSS (custom properties for light and dark themes)
- Bricolage Grotesque via `next/font`

## Project structure

```
splitsave/
├── app/
│   ├── layout.tsx      # root layout, fonts, theme bootstrap, metadata
│   ├── page.tsx        # the whole app: form, split logic, flip card, history, share menu
│   └── globals.css     # theme variables and all styling
├── public/             # static assets
├── .gitignore
├── .gitattributes
├── LICENSE
├── package.json
└── README.md
```

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To check a production build:

```bash
npm run build
npm start
```

## Privacy

- No servers, analytics, cookies or third-party requests for your data.
- Your UPI ID, payee name, theme choice and history are stored only in your browser's `localStorage`. Clearing site data removes them.

## Notes and limitations

- SplitSave only generates QR codes. It does not process payments and cannot confirm that a payment was received. "Mark done" is a manual step, so check your bank or UPI app before marking a payment as done.
- `upi://` links are usually not clickable inside chat apps. When sharing, a screenshot of the QR is often more reliable than the text link.
- Fees, limits and rules differ between banks, apps and payment providers. Check them yourself, and make sure how you use this tool complies with the terms of your bank or payment provider.
- Hover effects (such as the share menu) open on tap on touch devices.

## Credits

- Flip card design adapted from the Uiverse.io element "tricky-robin-67" by ElSombrero2.
- Share menu styling adapted from a Uiverse.io tooltip element by gamerx151.
- Other controls (switch, buttons, progress dots, theme toggle) are inspired by community designs on [Uiverse.io](https://uiverse.io), re-created for this project.

## License

Released under the [MIT License](LICENSE).
