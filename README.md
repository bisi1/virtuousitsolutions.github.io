Virtuous IT Solutions - Static site with a send-email Azure Function

This repo contains a static website (serve from Azure Storage static website) and an optional Azure Function under `api/sendEmail` that sends contact form submissions to an email address using SendGrid.

Quick start (local preview)

1. From the project root run a simple static server:

   python3 -m http.server 8000

2. Open http://localhost:8000 in your browser and use the contact form.

To send emails from the contact form without using the user's mail client, deploy the Azure Function (see `api/sendEmail/README.md`) and host the static site and function under the same domain (or configure CORS).
