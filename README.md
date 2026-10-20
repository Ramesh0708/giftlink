# GiftLink

A shareable gift wishlist. Add products from Amazon, Flipkart, Myntra, and anywhere else, then send one link so friends can buy what you actually want — and claim a gift so nobody doubles up.

Amazon and Flipkart do **not** allow apps to sign in with your shopping password. GiftLink never asks for those. Instead, connect a **shared wishlist link** (Amazon: Wish List → Share → Anyone with the link) or paste product URLs. The list goes live when you add a gift.

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
2. Open **How to use** if you need the walkthrough
3. Create a wishlist and add a gift. It goes live on its own.
4. Tap **Share on WhatsApp**. Friends open `/s/...`.

Save the private edit link shown in the editor. It opens the list on any device. Don’t send that link to friends.

Occasion pages (`/diwali-gift-list` and the other lists linked from the home page) are prerendered so the HTML is not an empty shell. Diwali is called out because the festival is in early November.

## Amazon Associates

Amazon.in buy links that friends see include an Associates `tag`. The default tag is `giftlink0e-21`, so this works with no Netlify setting. Set `AMAZON_ASSOCIATE_TAG` to use a different tag. A blank or invalid value falls back to `giftlink0e-21`. Other shops are left alone. The tag is added when a list is read, and it is not written into the saved wishlist.

In a function this is read with `Netlify.env.get("AMAZON_ASSOCIATE_TAG")`. Shared lists and the site footer include: “As an Amazon Associate, GiftLink earns from qualifying purchases.”
