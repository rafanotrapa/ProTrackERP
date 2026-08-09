#!/usr/bin/env bash
#
# Bikin dua ZIP siap upload ke cPanel:
#   ProTrackERP-backend.zip   -> extract di public_html/api/
#   ProTrackERP-frontend.zip  -> extract di public_html/
#
# Pakai:
#   ./deploy-build.sh
#   API_URL=https://api.domainlain.com OUT=/tmp ./deploy-build.sh
#
# Syarat: frontend/src harus bersih di git, karena URL API ditulis ulang
# sementara lalu dikembalikan pakai `git checkout`.
#
set -euo pipefail

API_URL="${API_URL:-https://api.bataviajayakreasindo.com}"
OUT="${OUT:-$HOME/Downloads}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BACKEND_ZIP="$OUT/ProTrackERP-backend.zip"
FRONTEND_ZIP="$OUT/ProTrackERP-frontend.zip"

# Isi backend. assets/ wajib ikut: utils/emailTemplates.js memuat
# assets/logo-protrack.png sebagai lampiran email reset password.
BACKEND_ITEMS=(server.js package.json package-lock.json
               config controllers middleware models routes utils assets)

info() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# --- 0. Pastikan source bersih, karena nanti dikembalikan pakai git checkout ---
if [[ -n "$(git status --porcelain frontend/src)" ]]; then
  echo "GAGAL: frontend/src masih ada perubahan belum di-commit."
  echo "Commit atau stash dulu, kalau tidak perubahanmu akan hilang saat revert."
  exit 1
fi

# --- 1. Tulis ulang URL API ke alamat produksi ---
info "Mengganti localhost:5000 -> $API_URL"
JUMLAH=$(grep -rl "http://localhost:5000" frontend/src | wc -l | tr -d ' ')
grep -rl "http://localhost:5000" frontend/src | while read -r f; do
  sed -i "s|http://localhost:5000|$API_URL|g" "$f"
done
echo "$JUMLAH berkas diperbarui"

# Apa pun hasilnya, source harus kembali ke localhost.
kembalikan_source() {
  info "Mengembalikan frontend/src ke localhost"
  git checkout -- frontend/src
}
trap kembalikan_source EXIT

# --- 2. Build ---
info "Build frontend"
( cd frontend && npm run build )

# --- 3. .htaccess supaya refresh halaman tidak 'cannot GET /dashboard' ---
info "Menulis .htaccess SPA"
cat > frontend/dist/.htaccess <<'HTACCESS'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
HTACCESS

# --- 4. Zip ---
# .env, uploads/ dan node_modules/ sengaja TIDAK ikut, supaya rahasia dan
# dokumen milik user yang sudah ada di server tidak tertimpa saat extract.
info "Membuat ZIP di $OUT"
mkdir -p "$OUT"
rm -f "$BACKEND_ZIP" "$FRONTEND_ZIP"

if command -v zip >/dev/null 2>&1; then
  zip -rq "$BACKEND_ZIP" "${BACKEND_ITEMS[@]}"
  ( cd frontend/dist && zip -rq "$FRONTEND_ZIP" . )
else
  # Windows tanpa `zip`. JANGAN pakai Compress-Archive milik PowerShell: dia
  # menulis pemisah jalur backslash, sedangkan spesifikasi ZIP mewajibkan
  # forward slash. Akibatnya di server Linux berkas ter-extract dengan nama
  # harfiah "config\db.js" dan struktur foldernya hilang.
  # Modul zipfile Python selalu menulis forward slash.
  python - "$BACKEND_ZIP" "${BACKEND_ITEMS[@]}" <<'PY'
import os, sys, zipfile
dest, items = sys.argv[1], sys.argv[2:]
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
    for item in items:
        if os.path.isfile(item):
            z.write(item, item.replace(os.sep, '/'))
        else:
            for root, _, files in os.walk(item):
                for f in files:
                    p = os.path.join(root, f)
                    z.write(p, os.path.relpath(p).replace(os.sep, '/'))
PY

  python - "$FRONTEND_ZIP" frontend/dist <<'PY'
import os, sys, zipfile
dest, base = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(base):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, base).replace(os.sep, '/'))
PY
fi

info "Selesai"
ls -lh "$BACKEND_ZIP" "$FRONTEND_ZIP"
