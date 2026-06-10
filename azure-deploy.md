# Azure Static Website Deploy

This document contains the minimal Azure CLI commands to enable and upload the static site to an Azure Storage account.

Prerequisites
- Azure CLI installed and logged in (az login)
- An existing Storage account (or create one)

Enable static website hosting (replace <STORAGE_ACCOUNT> and optionally <RESOURCE_GROUP>):

```bash
az storage blob service-properties update \
  --account-name <STORAGE_ACCOUNT> \
  --static-website \
  --index-document index.html \
  --404-document 404.html
```

Upload files to the $web container (from project root):

```bash
az storage blob upload-batch --account-name <STORAGE_ACCOUNT> --source ./ --destination '$web'
```

Get the primary endpoint:

```bash
az storage account show --name <STORAGE_ACCOUNT> --query "primaryEndpoints.web" -o tsv
```

Optional: configure a custom domain or enable CDN in front of the storage account for HTTPS and caching.

