FROM oven/bun
WORKDIR /src
COPY . .
EXPOSE 80
ENTRYPOINT ["bun", "index.ts"]