import os
import zipfile
import shutil

dist_dir = 's:/Anti/DA Support/dist'
zip_output = 's:/Anti/DA Support/support-hostinger.zip'

# 1. Also copy asset files to root of dist for bulletproof fallback
assets_dir = os.path.join(dist_dir, 'assets')
if os.path.exists(assets_dir):
    for f in os.listdir(assets_dir):
        src_file = os.path.join(assets_dir, f)
        dest_file = os.path.join(dist_dir, f)
        if os.path.isfile(src_file):
            shutil.copy2(src_file, dest_file)
            print(f"Copied root fallback asset: {f}")

# 2. Build ZIP with standard POSIX / UNIX attributes and forward slashes
if os.path.exists(zip_output):
    os.remove(zip_output)

with zipfile.ZipFile(zip_output, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    # Explicitly write assets/ directory entry first
    zdir = zipfile.ZipInfo('assets/')
    zdir.create_system = 3 # Unix
    zdir.external_attr = 0o755 << 16 | 0o040000 # Directory mode
    zf.writestr(zdir, '')

    for root, dirs, files in os.walk(dist_dir):
        # Sort so structure is clean
        dirs.sort()
        files.sort()

        for d in dirs:
            rel_dir = os.path.relpath(os.path.join(root, d), dist_dir).replace('\\', '/') + '/'
            if rel_dir != 'assets/': # already added
                zinfo = zipfile.ZipInfo(rel_dir)
                zinfo.create_system = 3
                zinfo.external_attr = 0o755 << 16 | 0o040000
                zf.writestr(zinfo, '')

        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, dist_dir).replace('\\', '/')
            zinfo = zipfile.ZipInfo(rel_path)
            zinfo.create_system = 3 # Unix
            zinfo.external_attr = 0o644 << 16 # File mode
            with open(full_path, 'rb') as fp:
                zf.writestr(zinfo, fp.read())

print("Created zip successfully! Checking entries:")
with zipfile.ZipFile(zip_output, 'r') as zf:
    for item in zf.infolist():
        print(f"  {item.filename:45} is_dir={item.is_dir()} sys={item.create_system}")
