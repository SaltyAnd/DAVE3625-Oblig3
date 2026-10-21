# Blueflow — Water intake tracker

Blueflow is a dark-blue fluid tracker. Both the water and alternative-fluid sections offer a 250 mL glass, a 500 mL medium bottle, a 1 L large bottle, custom containers, and custom drink amounts. Alternative fluid examples include coffee, milk, soda, and juice. The dashboard shows water, alternative fluid, and combined fluid totals; its stacked bar shows water in blue and alternative fluid in purple against the daily water goal. The drink list always shows today's drinks; only today's entries can be added or removed. The calendar shows daily totals for selected dates, without displaying past drink lists. The editable daily goal tracks water only. Switch between millilitres and litres at any time, and remove individual drink entries if you log one by mistake.

## Run it

Open `index.html` in a modern browser. No installation, build step, account, or internet connection is required. Your entries and goal are stored in that browser on your device using local storage.

The daily goal starts at 2,000 mL as an editable example, not a medical recommendation.

## Project files

- `index.html` contains the page structure and labels.
- `styles.css` contains the visual design, with sections for the page layout, dashboard, calendar, forms, history, and mobile layout.
- `script.js` contains the tracker behavior, storage, and rendering logic.

The HTML links to the stylesheet and script, so keep all three files together when running or publishing the app.

## Publish it

Because the app is a static website, it can be published using GitHub Pages from the repository's root. Enable Pages in the repository settings and select the branch containing `index.html`.