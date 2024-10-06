# Quadrata Privacy Data Extraction

This is a NodeJS script that will extract the privacy data from the Quadrata Network's API for your company.

## Installation

1. Clone this repository and install the dependencies:

```bash
npm install
```

2. Copy distributed config file:

```bash
cp config.js.dist config.js
```

3. Edit the `config.js` file with your Quadrata API keys:

You need to set the values for `API_KEY` and `PRIVATE_KEY_DER_BASE_64` in your `config.js`.

> If you do not have an API key or private key, you can create one in your Quadrata dashboard.

## Available Scripts

These scripts will fetch all the privacy data for your company from the Quadrata Network's API and
save it to a ZIP file in the `output` directory.

### Consent

To extract all the privacy data for which your company has been given consent by the user, run:

```bash
npm run consent
```

### Exempt

If you company does not require consent and is exempt under the GDPR addendum, run:

```bash
npm run exempt
```

## Fetching By Date Range

If you wish to apply a date range to the export, you can do so by editing your `config.js` file and setting
the `DATE_FROM` and `DATE_TO` values.

The format for the date is `mm-dd-yyyy`.

```javascript
const DATE_FROM = '01-01-2021';
const DATE_TO = '12-31-2021';
```

