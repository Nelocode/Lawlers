# Essa, Janho & Associates, LLC — Landing Page

Executive-grade, responsive landing page for **Essa, Janho & Associates, LLC**, law firm based in Marietta, Georgia.

## Tech Stack
- Pure Semantic HTML5, Modern CSS3 (Cascade Layers, Grid, Subgrid, Container Queries), Vanilla JS.
- Production-grade Alpine Nginx with Gzip compression, asset caching, and security headers.
- Zero client-side dependencies.

## Deployment with Docker / Easypanel

1. **Easypanel Setup**:
   - Create a new **App** in Easypanel.
   - Select **GitHub** as the source and point to `https://github.com/Nelocode/Lawlers`.
   - Build method: **Dockerfile**.
   - Port: **80**.

2. **Local Docker Run**:
   ```bash
   docker build -t lawlers-landing .
   docker run -p 8080:80 lawlers-landing
   ```
   Open `http://localhost:8080`.
