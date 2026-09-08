# Dockerfile for running Solana Trading Bot locally with Deno
FROM denoland/deno:latest

WORKDIR /app

# Copy files
COPY . .

# Cache dependencies
RUN deno cache --no-check=remote src/index.ts

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno eval "fetch('http://localhost:8000/?mode=warmup').then(r => r.ok || Deno.exit(1)).catch(() => Deno.exit(1))"

# Run with required permissions
CMD ["run", "--allow-env", "--allow-net", "--allow-read", "src/index.ts"]
