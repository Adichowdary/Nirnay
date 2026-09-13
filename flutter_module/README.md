# NIYANTRA Flutter Field Module

Offline-first companion to the Next.js web app. Embeds via `FlutterWebView` iframe + `postMessage`.

## Quick start

```bash
cd flutter_module
flutter create --platforms web .
# copy lib/inspection_form.dart as lib/main.dart, then:
flutter run -d web-server --web-port=53601 --web-hostname=127.0.0.1
```

Set in `.env.local`:

```bash
NEXT_PUBLIC_FLUTTER_URL=http://127.0.0.1:53601/
```

Open `/dashboard/field-app` to see the live bridge.

## Protocol

- Host → Flutter: `{ type: 'host-ready', source: 'niyantra-web' }`
- Flutter → Host: `{ type: 'flutter-ready', source: 'niyantra-flutter' }`
- Flutter → Host: `{ type: 'inspection-submit', payload: {...}, source: 'niyantra-flutter' }`

Web app works fully without Flutter — the component shows a graceful offline fallback.
