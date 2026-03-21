from pathlib import Path
import shutil

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Sincroniza archivos de media al frontend/public/media para versionarlos en Git."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default=str(settings.MEDIA_ROOT),
            help="Directorio origen de media (por defecto, MEDIA_ROOT).",
        )
        parser.add_argument(
            "--target",
            default=str(Path(settings.BASE_DIR).parent / "frontend" / "public" / "media"),
            help="Directorio destino (por defecto, frontend/public/media).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Solo muestra qué copiaría, sin copiar archivos.",
        )

    def handle(self, *args, **options):
        source = Path(options["source"]).resolve()
        target = Path(options["target"]).resolve()
        dry_run = options["dry_run"]

        if not source.exists():
            self.stdout.write(self.style.ERROR(f"El origen no existe: {source}"))
            return

        target.mkdir(parents=True, exist_ok=True)

        copied = 0
        skipped = 0

        for src_file in source.rglob("*"):
            if not src_file.is_file():
                continue

            rel_path = src_file.relative_to(source)
            dst_file = target / rel_path
            dst_file.parent.mkdir(parents=True, exist_ok=True)

            needs_copy = not dst_file.exists() or src_file.stat().st_mtime > dst_file.stat().st_mtime
            if needs_copy:
                copied += 1
                if not dry_run:
                    shutil.copy2(src_file, dst_file)
            else:
                skipped += 1

        mode = "SIMULACION" if dry_run else "SINCRONIZACION"
        self.stdout.write(self.style.SUCCESS(f"{mode} OK"))
        self.stdout.write(f"Origen:  {source}")
        self.stdout.write(f"Destino: {target}")
        self.stdout.write(f"Copiados/actualizados: {copied}")
        self.stdout.write(f"Sin cambios:          {skipped}")
        self.stdout.write("")
        self.stdout.write("Siguiente paso:")
        self.stdout.write("  git add frontend/public/media")
        self.stdout.write('  git commit -m "add/update course media files"')

