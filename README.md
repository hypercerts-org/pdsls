# SDSls - AT Protocol Explorer

SDSls is a friendly fork of https://pdsls.dev, with experimental support
for:

- writes to SDS (Shared Data Server) repositories
- a playground for exploring and invoking XRPC API calls

It is currently an early stage project.  If possible we would like to
contribute changes back to the upstream project where it makes sense,
and not have the codebase diverge too far from upstream.

The original PDSls README remains below.

# PDSls - AT Protocol Explorer

Lightweight and client-side web app to navigate [atproto](https://atproto.com/).

## Features

- Browse the public data on PDSes (Personal Data Servers).
- Login to manage records in your repository.
- Jetstream and firehose (com.atproto.sync.subscribeRepos) streaming.
- Backlinks support with [constellation](https://constellation.microcosm.blue/).
- Query moderation labels.

## Hacking

You will need `node` and `pnpm` to get started:

```bash
pnpm i      # install deps
pnpm dev    # or pnpm run start, runs vite
pnpm build  # runs vite build
pnpm serve  # runs vite preview
```

### Environment Variables

You can configure the app using environment variables. Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
# Edit .env with your settings
```

#### Development

By default, the app runs on `http://127.0.0.1:13213` using OAuth loopback mode (works behind NAT):

```bash
pnpm dev  # No environment variables needed
```

**Optional customization:**
- `SERVER_HOST` - Local server host (default: `127.0.0.1`)
- `SERVER_PORT` - Local server port (default: `13213`)

**Using a tunnel (ngrok, pagekite, etc.) during development:**

If you're using a tunnel to make your dev server publicly accessible, set `PUBLIC_HOSTNAME` in your `.env` file or via command line:

```bash
# In .env file:
PUBLIC_HOSTNAME=myapp.ngrok-free.app

# Or via command line:
PUBLIC_HOSTNAME=myapp.ngrok-free.app pnpm dev
```

This will:
- Use the public URL for OAuth client metadata (instead of localhost loopback)
- Configure `allowedHosts` for the dev server
- Require the `oauth-client-metadata.json` file to be accessible at `https://myapp.ngrok-free.app/oauth-client-metadata.json`

#### Production

For production builds, you **must** set `PUBLIC_HOSTNAME`:

```bash
# In .env file:
PUBLIC_HOSTNAME=pdsls.dev

# Then build:
pnpm build

# Or via command line:
PUBLIC_HOSTNAME=pdsls.dev pnpm build
```

The `PUBLIC_HOSTNAME` is used to generate the OAuth client metadata URLs that ATProto servers need to access.

## Credits

[atcute](https://github.com/mary-ext/atcute) - atproto SDK\
[@skyware/firehose](https://github.com/skyware-js/firehose) - Firehose client
