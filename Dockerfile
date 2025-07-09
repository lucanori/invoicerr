FROM docker.io/library/node:22-alpine

RUN apk add --no-cache \
    nginx \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    bash \
    dumb-init \
    && addgroup -g 65534 -S nogroup || true \
    && adduser -S -D -H -u 65534 -g nogroup nobody || true \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

WORKDIR /usr/src/app/backend
RUN pnpm install --prefer-offline

WORKDIR /usr/src/app/frontend  
RUN pnpm install --prefer-offline

WORKDIR /usr/src/app
COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /usr/src/app/backend
RUN npx prisma generate && pnpm build

WORKDIR /usr/src/app/frontend
RUN pnpm build

RUN mkdir -p /usr/share/nginx/html /usr/share/nginx/backend \
    && cp -r /usr/src/app/frontend/dist/* /usr/share/nginx/html/ \
    && cp -r /usr/src/app/backend/dist/* /usr/share/nginx/backend/ \
    && cp -r /usr/src/app/backend/node_modules /usr/share/nginx/backend/ \
    && cp /usr/src/app/backend/package*.json /usr/share/nginx/backend/ \
    && cp -r /usr/src/app/backend/prisma /usr/share/nginx/ \
    && mkdir -p /usr/share/nginx/storage/temp /usr/share/nginx/storage/logs \
    && chown -R nobody:nogroup /usr/share/nginx/storage

COPY entrypoint.sh /usr/share/nginx/entrypoint.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod +x /usr/share/nginx/entrypoint.sh

USER nobody:nogroup

EXPOSE 80

CMD ["/usr/bin/dumb-init", "/bin/sh", "-c", "/usr/share/nginx/entrypoint.sh"]
