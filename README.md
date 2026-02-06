# jefflivingston.com

Personal brochure website for [www.jefflivingston.com](https://www.jefflivingston.com).

## Structure

```
├── index.html          # Main page
├── css/styles.css      # Stylesheet
├── js/main.js          # Interactivity (nav, scroll animations, form)
├── nginx.conf          # Nginx configuration
├── Dockerfile          # Docker build (nginx-based)
└── docker-compose.yml  # Docker Compose for deployment
```

## Local Development

Open `index.html` directly in a browser — no build step required.

Or use any local server:

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

## Deployment with Docker

```bash
docker compose up -d
```

This builds an nginx container serving the static site on port 80.

## Customization

- **Content**: Edit `index.html` to update text, links, and sections
- **Photo**: Replace the placeholder in the About section with an `<img>` tag
- **Colors**: Adjust CSS custom properties at the top of `css/styles.css`
- **Contact form**: Currently uses `mailto:` — swap in a form backend (Formspree, Netlify Forms, etc.) for server-side handling
