# Isolated C++ Execution Sandbox
# Scaled-to-zero Google Cloud Run service for C++20 compilation and test execution
FROM node:22-bookworm-slim

# Install modern g++ with C++20 standard library support and Linux sandbox utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    util-linux \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged sandbox user with restricted shell
RUN useradd -m -u 10001 -s /bin/bash sandbox

WORKDIR /app

# Copy compiled standalone runner server
COPY dist/server.js ./server.js

# Ensure sandbox user owns the application directory
RUN chown -R sandbox:sandbox /app

USER sandbox

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://localhost:' + (process.env.PORT || 8080) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
