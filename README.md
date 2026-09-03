# GiftLink

A shareable gift wishlist. Add products from Amazon, Flipkart, Myntra, and anywhere else, then send one link so friends can buy what you actually want — and claim a gift so nobody doubles up.

Amazon and Flipkart do **not** allow apps to sign into your shopping account. GiftLink never asks for those passwords. You paste a product link (or type the item), we host the list.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. Sharing and “I’ll get this” work on your machine via a local store in `.data/`.

## Deploy on Netlify

1. Push this folder to GitHub (or drag the **repo**, not only `dist`, into [Netlify](https://app.netlify.com)).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. `netlify.toml` is already set. Functions store published lists so friends on other phones can open `/w/your-id`.

After deploy:

1. Open your Netlify URL
2. Create a wishlist, add gifts, click **Publish** or **Copy share link**
3. Send `/w/...` to friends

Edit your list from the same browser at `/me/...` (saved on that device).
